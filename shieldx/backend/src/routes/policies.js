import express from 'express'
import { body, validationResult } from 'express-validator'
import { query, getClient } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate, requireUnderwriter } from '../middleware/auth.js'
import { audit } from '../middleware/audit.js'
import { calculatePremium, getNCBPercent } from '../utils/premium.js'
import { generatePolicyCertificate } from '../utils/pdf.js'
import { generatePolicyNumber } from '../utils/generators.js'
import {
  sendPolicyIssuedEmail, sendPolicyRejectedEmail, sendNCBUpdateEmail,
} from '../utils/email.js'
import { createPaymentOrder, verifyPaymentSignature } from '../utils/razorpay.js'
import fs from 'fs'

const router = express.Router()

// ── GET /api/policies/my ──────────────────────────────────
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*, pr.name AS product_name
     FROM policies p JOIN products pr ON p.product_id=pr.id
     WHERE p.user_id=$1 ORDER BY p.created_at DESC`,
    [req.user.id]
  )
  res.json({ policies: result.rows })
}))

// ── GET /api/policies — staff ─────────────────────────────
router.get('/', authenticate, requireUnderwriter, asyncHandler(async (req, res) => {
  const { status, type, page=1, limit=20 } = req.query
  const params = []
  let where = 'WHERE 1=1'
  if (status) { params.push(status); where += ` AND p.status=$${params.length}` }
  if (type)   { params.push(type);   where += ` AND p.type=$${params.length}` }
  params.push(limit, (page-1)*limit)

  const [rows, count] = await Promise.all([
    query(
      `SELECT p.*,u.full_name,u.email,u.phone,pr.name AS product_name
       FROM policies p
       JOIN users u     ON p.user_id=u.id
       JOIN products pr ON p.product_id=pr.id
       ${where} ORDER BY p.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    ),
    query(`SELECT COUNT(*) FROM policies p ${where}`, params.slice(0,-2)),
  ])

  res.json({ policies: rows.rows, total: parseInt(count.rows[0].count), page: +page, limit: +limit })
}))

// ── GET /api/policies/:id ─────────────────────────────────
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*,u.full_name,u.email,u.phone,pr.name AS product_name
     FROM policies p
     JOIN users u     ON p.user_id=u.id
     JOIN products pr ON p.product_id=pr.id
     WHERE p.id=$1`,
    [req.params.id]
  )
  const policy = result.rows[0]
  if (!policy) return res.status(404).json({ error: 'Policy not found' })
  if (req.user.role === 'customer' && policy.user_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' })
  res.json({ policy })
}))

// ── POST /api/policies/create-order — create Razorpay order ──
router.post('/create-order', authenticate, [
  body('product_id').isUUID(),
  body('type').isIn(['life','health','vehicle']),
  body('premium_params').isObject(),
  body('sum_assured').isNumeric(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { product_id, type, premium_params } = req.body

  // Verify KYC before purchase
  const kycResult = await query(
    `SELECT COUNT(*) FROM kyc_documents
     WHERE user_id=$1 AND status='verified'`,
    [req.user.id]
  )
  if (parseInt(kycResult.rows[0].count) < 1) {
    return res.status(400).json({
      error: 'At least one KYC document must be verified before purchasing a policy',
    })
  }

  // Verify product
  const productRes = await query('SELECT * FROM products WHERE id=$1 AND is_active=TRUE', [product_id])
  if (!productRes.rows[0]) return res.status(404).json({ error: 'Product not found or inactive' })

  const premium = calculatePremium(type, premium_params)

  // Create Razorpay order
  const order = await createPaymentOrder(premium.totalPremium, product_id, req.user.id)

  // Store pending intent in session-like DB row (policy row in pending state)
  res.json({ order, premium })
}))

// ── POST /api/policies — confirm purchase after payment ───
router.post('/', authenticate, [
  body('product_id').isUUID(),
  body('type').isIn(['life','health','vehicle']),
  body('premium_params').isObject(),
  body('sum_assured').isNumeric(),
  body('start_date').isDate(),
  body('end_date').isDate(),
  // Razorpay payment confirmation
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const {
    product_id, type, premium_params, sum_assured,
    start_date, end_date,
    nominee_name, nominee_relation, policy_details,
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  } = req.body

  // 1. Verify payment signature
  const signatureValid = verifyPaymentSignature({
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  })
  if (!signatureValid) {
    return res.status(400).json({ error: 'Payment verification failed. Contact support.' })
  }

  // 2. Prevent duplicate order processing
  const dupCheck = await query(
    'SELECT id FROM payments WHERE razorpay_order_id=$1', [razorpay_order_id]
  )
  if (dupCheck.rows[0]) {
    return res.status(409).json({ error: 'Payment already processed' })
  }

  // 3. Verify product exists
  const productRes = await query('SELECT * FROM products WHERE id=$1 AND is_active=TRUE', [product_id])
  if (!productRes.rows[0]) return res.status(404).json({ error: 'Product not found' })

  // 4. Re-calculate premium server-side (never trust client amount)
  const premium = calculatePremium(type, premium_params)

  // 5. Validate sum_assured against product limits
  const product = productRes.rows[0]
  if (product.max_coverage && parseFloat(sum_assured) > parseFloat(product.max_coverage)) {
    return res.status(400).json({
      error: `Sum assured exceeds product maximum of ₹${Number(product.max_coverage).toLocaleString('en-IN')}`,
    })
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')

    const policyNumber = await generatePolicyNumber(type)

    // Create policy (pending underwriter review)
    const policyRes = await client.query(
      `INSERT INTO policies
         (policy_number,user_id,product_id,type,sum_assured,
          annual_premium,gst_amount,total_premium,
          start_date,end_date,next_renewal,
          nominee_name,nominee_relation,policy_details,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$9,$11,$12,$13,'pending')
       RETURNING *`,
      [
        policyNumber, req.user.id, product_id, type, sum_assured,
        premium.basePremium, premium.gstAmount, premium.totalPremium,
        start_date, end_date,
        nominee_name||null, nominee_relation||null,
        policy_details ? JSON.stringify(policy_details) : null,
      ]
    )
    const policy = policyRes.rows[0]

    // Record payment
    await client.query(
      `INSERT INTO payments
         (policy_id,user_id,amount,razorpay_order_id,razorpay_payment_id,razorpay_signature,status,paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,'success',NOW())`,
      [policy.id, req.user.id, premium.totalPremium,
       razorpay_order_id, razorpay_payment_id, razorpay_signature]
    )

    // Schedule renewal reminders (30, 15, 7 days before expiry)
    for (const days of [30, 15, 7]) {
      const d = new Date(end_date)
      d.setDate(d.getDate() - days)
      await client.query(
        `INSERT INTO renewal_reminders (policy_id,user_id,reminder_date,days_before)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [policy.id, req.user.id, d.toISOString().split('T')[0], days]
      )
    }

    await client.query('COMMIT')

    audit(req.user.id, 'policy_purchased', 'policy', policy.id,
      { policy_number: policyNumber, type, premium: premium.totalPremium }, req.ip)

    res.status(201).json({
      message: 'Policy application submitted. Pending underwriter approval.',
      policy, premium,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}))

// ── PUT /api/policies/:id/approve — underwriter ───────────
router.put('/:id/approve', authenticate, requireUnderwriter, [
  body('action').isIn(['approve','reject']),
  body('rejection_reason').if(body('action').equals('reject')).notEmpty()
    .withMessage('Rejection reason required when rejecting'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { action, rejection_reason } = req.body
  const newStatus = action === 'approve' ? 'active' : 'rejected'

  const result = await query(
    `UPDATE policies
     SET status=$1, reviewed_by=$2, reviewed_at=NOW(), rejection_reason=$3
     WHERE id=$4 AND status='pending'
     RETURNING *`,
    [newStatus, req.user.id, rejection_reason||null, req.params.id]
  )
  const policy = result.rows[0]
  if (!policy) return res.status(404).json({ error: 'Policy not found or already reviewed' })

  const userRes = await query('SELECT full_name,email,phone FROM users WHERE id=$1', [policy.user_id])
  const user = userRes.rows[0]

  audit(req.user.id, `policy_${action}d`, 'policy', policy.id,
    { new_status: newStatus, rejection_reason }, req.ip)

  if (newStatus === 'active') {
    // Generate PDF and email customer
    const pdfPath = await generatePolicyCertificate(policy, user)
    await query('UPDATE policies SET certificate_path=$1 WHERE id=$2', [pdfPath, policy.id])
    sendPolicyIssuedEmail(user, policy, pdfPath).catch(e => console.error('Email:', e.message))
  } else {
    sendPolicyRejectedEmail(user, policy).catch(e => console.error('Email:', e.message))
  }

  res.json({ message: `Policy ${action}d successfully`, policy })
}))

// ── GET /api/policies/:id/certificate — download PDF ──────
router.get('/:id/certificate', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*,u.full_name,u.email,u.phone
     FROM policies p JOIN users u ON p.user_id=u.id
     WHERE p.id=$1`,
    [req.params.id]
  )
  const policy = result.rows[0]
  if (!policy) return res.status(404).json({ error: 'Policy not found' })
  if (req.user.role === 'customer' && policy.user_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' })
  if (policy.status !== 'active')
    return res.status(400).json({ error: 'Certificate only available for active policies' })

  // Use cached PDF or regenerate
  let pdfPath = policy.certificate_path
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    pdfPath = await generatePolicyCertificate(policy, {
      full_name: policy.full_name, email: policy.email, phone: policy.phone,
    })
    await query('UPDATE policies SET certificate_path=$1 WHERE id=$2', [pdfPath, policy.id])
  }

  audit(req.user.id, 'certificate_downloaded', 'policy', policy.id, null, req.ip)
  res.download(pdfPath, `${policy.policy_number}_certificate.pdf`)
}))

// ── POST /api/policies/:id/renew — renew a policy ─────────
router.post('/:id/renew', authenticate, [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const oldResult = await query(
    'SELECT * FROM policies WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  )
  const old = oldResult.rows[0]
  if (!old) return res.status(404).json({ error: 'Policy not found' })
  if (!['active','expired'].includes(old.status))
    return res.status(400).json({ error: 'Only active or expired policies can be renewed' })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  if (!verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }))
    return res.status(400).json({ error: 'Payment verification failed' })

  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Calculate NCB for renewed policy
    // NCB increases by 1 claim-free year only if no claims were made in current term
    const claimsInTerm = await client.query(
      `SELECT COUNT(*) FROM claims
       WHERE policy_id=$1 AND status NOT IN ('rejected') AND created_at >= $2`,
      [old.id, old.start_date]
    )
    const hadClaims    = parseInt(claimsInTerm.rows[0].count) > 0
    const newClaimFreeYears = hadClaims ? 0 : Math.min((old.claim_free_years || 0) + 1, 5)
    const newNCBPercent     = getNCBPercent(newClaimFreeYears)

    // New policy term (1 year from old end_date or today, whichever is later)
    const baseDate  = new Date(Math.max(new Date(old.end_date), new Date()))
    const startDate = baseDate.toISOString().split('T')[0]
    const endD      = new Date(baseDate)
    endD.setFullYear(endD.getFullYear() + 1)
    const endDate   = endD.toISOString().split('T')[0]

    const policyNumber = await generatePolicyNumber(old.type)
    const premium      = calculatePremium(old.type, {
      ...(old.policy_details || {}),
      ncbPercent: newNCBPercent,
    })

    const newPolicyRes = await client.query(
      `INSERT INTO policies
         (policy_number,user_id,product_id,type,sum_assured,
          annual_premium,gst_amount,total_premium,
          start_date,end_date,next_renewal,
          nominee_name,nominee_relation,policy_details,status,
          ncb_percent,claim_free_years,parent_policy_id,renewal_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$9,$11,$12,$13,'pending',$14,$15,$16,$17)
       RETURNING *`,
      [
        policyNumber, old.user_id, old.product_id, old.type, old.sum_assured,
        premium.basePremium, premium.gstAmount, premium.totalPremium,
        startDate, endDate,
        old.nominee_name, old.nominee_relation, old.policy_details,
        newNCBPercent, newClaimFreeYears, old.id, (old.renewal_count||0)+1,
      ]
    )
    const newPolicy = newPolicyRes.rows[0]

    await client.query(
      `INSERT INTO payments
         (policy_id,user_id,amount,razorpay_order_id,razorpay_payment_id,razorpay_signature,status,paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,'success',NOW())`,
      [newPolicy.id, req.user.id, premium.totalPremium,
       razorpay_order_id, razorpay_payment_id, razorpay_signature]
    )

    // Record NCB change
    if (newNCBPercent !== old.ncb_percent) {
      await client.query(
        `INSERT INTO ncb_history (policy_id,user_id,old_ncb,new_ncb,reason,changed_by)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [newPolicy.id, req.user.id, old.ncb_percent, newNCBPercent,
         hadClaims ? 'claim_filed' : 'claim_free_year', req.user.id]
      )
    }

    // Mark old policy as expired if still active
    if (old.status === 'active') {
      await client.query(`UPDATE policies SET status='expired' WHERE id=$1`, [old.id])
    }

    // Schedule new reminders
    for (const days of [30, 15, 7]) {
      const d = new Date(endDate)
      d.setDate(d.getDate() - days)
      await client.query(
        `INSERT INTO renewal_reminders (policy_id,user_id,reminder_date,days_before)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [newPolicy.id, req.user.id, d.toISOString().split('T')[0], days]
      )
    }

    await client.query('COMMIT')

    audit(req.user.id, 'policy_renewed', 'policy', newPolicy.id,
      { old_policy_id: old.id, new_ncb: newNCBPercent }, req.ip)

    // Email NCB update if changed
    const userRes = await query('SELECT full_name,email FROM users WHERE id=$1', [req.user.id])
    if (newNCBPercent !== old.ncb_percent) {
      sendNCBUpdateEmail(
        userRes.rows[0], newPolicy, old.ncb_percent, newNCBPercent,
        hadClaims ? 'Claim filed during previous term' : 'Claim-free year'
      ).catch(e => console.error('NCB email:', e.message))
    }

    res.status(201).json({
      message: 'Policy renewal submitted. Pending underwriter approval.',
      policy:  newPolicy, premium,
      ncb:     { old: old.ncb_percent, new: newNCBPercent, claim_free_years: newClaimFreeYears },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}))

// ── PUT /api/policies/:id/cancel ──────────────────────────
router.put('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE policies SET status='cancelled'
     WHERE id=$1 AND user_id=$2 AND status IN ('active','pending')
     RETURNING *`,
    [req.params.id, req.user.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Policy not found or cannot be cancelled' })
  audit(req.user.id, 'policy_cancelled', 'policy', req.params.id, null, req.ip)
  res.json({ message: 'Policy cancelled. Refund processing will take 5–7 business days.', policy: result.rows[0] })
}))

export default router
