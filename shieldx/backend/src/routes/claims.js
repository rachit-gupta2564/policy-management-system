import express from 'express'
import { body, validationResult } from 'express-validator'
import path from 'path'
import fs from 'fs'
import { query, getClient } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate, requireAdjuster } from '../middleware/auth.js'
import { handleUpload, uploadClaimDocs } from '../middleware/upload.js'
import { audit } from '../middleware/audit.js'
import { generateClaimNumber } from '../utils/generators.js'
import { sendClaimStatusEmail } from '../utils/email.js'

const router = express.Router()

// Valid state machine transitions
const TRANSITIONS = {
  submitted:    ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved:     ['disbursed'],
  rejected:     [],
  disbursed:    [],
}

// ── GET /api/claims/my ────────────────────────────────────
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT c.*, p.policy_number, p.type AS policy_type,
            COALESCE(json_agg(cd) FILTER (WHERE cd.id IS NOT NULL), '[]') AS documents
     FROM claims c
     JOIN policies p ON c.policy_id=p.id
     LEFT JOIN claim_documents cd ON c.id=cd.claim_id
     WHERE c.user_id=$1
     GROUP BY c.id, p.policy_number, p.type
     ORDER BY c.created_at DESC`,
    [req.user.id]
  )
  res.json({ claims: result.rows })
}))

// ── GET /api/claims — staff ───────────────────────────────
router.get('/', authenticate, requireAdjuster, asyncHandler(async (req, res) => {
  const { status, page=1, limit=20 } = req.query
  const params = []
  let where = 'WHERE 1=1'
  if (status) { params.push(status); where += ` AND c.status=$${params.length}` }
  params.push(limit, (page-1)*limit)

  const result = await query(
    `SELECT c.*,u.full_name,u.email,u.phone,p.policy_number,p.type AS policy_type
     FROM claims c
     JOIN users u    ON c.user_id=u.id
     JOIN policies p ON c.policy_id=p.id
     ${where} ORDER BY c.created_at DESC
     LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  )
  res.json({ claims: result.rows })
}))

// ── GET /api/claims/:id ───────────────────────────────────
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT c.*,u.full_name,u.email,p.policy_number,p.type AS policy_type,
            COALESCE(json_agg(DISTINCT cd) FILTER (WHERE cd.id IS NOT NULL), '[]') AS documents,
            COALESCE(json_agg(DISTINCT csh ORDER BY csh.created_at) FILTER (WHERE csh.id IS NOT NULL),'[]') AS history
     FROM claims c
     JOIN users u       ON c.user_id=u.id
     JOIN policies p    ON c.policy_id=p.id
     LEFT JOIN claim_documents cd     ON c.id=cd.claim_id
     LEFT JOIN claim_status_history csh ON c.id=csh.claim_id
     WHERE c.id=$1
     GROUP BY c.id,u.full_name,u.email,p.policy_number,p.type`,
    [req.params.id]
  )
  const claim = result.rows[0]
  if (!claim) return res.status(404).json({ error: 'Claim not found' })
  if (req.user.role === 'customer' && claim.user_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' })
  res.json({ claim })
}))

// ── POST /api/claims — file a claim ──────────────────────
router.post('/',
  authenticate,
  handleUpload(uploadClaimDocs),
  [
    body('policy_id').isUUID(),
    body('incident_date').isDate(),
    body('description').trim().isLength({ min: 20 })
      .withMessage('Description must be at least 20 characters'),
    body('claim_amount').isFloat({ min: 1 }).withMessage('Claim amount must be greater than 0'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { policy_id, incident_date, description, claim_amount, bank_account, doc_types } = req.body

    // 1. Verify policy belongs to user and is active
    const policyRes = await query(
      'SELECT * FROM policies WHERE id=$1 AND user_id=$2',
      [policy_id, req.user.id]
    )
    const policy = policyRes.rows[0]
    if (!policy) return res.status(404).json({ error: 'Policy not found' })
    if (policy.status !== 'active')
      return res.status(400).json({ error: 'Claims can only be filed against active policies' })

    // 2. Check policy not expired
    if (new Date(policy.end_date) < new Date())
      return res.status(400).json({ error: 'Cannot file claim on an expired policy' })

    // 3. Validate claim amount does not exceed sum assured
    if (parseFloat(claim_amount) > parseFloat(policy.sum_assured)) {
      return res.status(400).json({
        error: `Claim amount cannot exceed sum assured of ₹${Number(policy.sum_assured).toLocaleString('en-IN')}`,
      })
    }

    // 4. Check incident date within policy period
    const incident = new Date(incident_date)
    if (incident < new Date(policy.start_date) || incident > new Date(policy.end_date)) {
      return res.status(400).json({ error: 'Incident date must be within the policy period' })
    }

    const client = await getClient()
    try {
      await client.query('BEGIN')

      const claimNumber = await generateClaimNumber()

      const claimRes = await client.query(
        `INSERT INTO claims
           (claim_number,policy_id,user_id,incident_date,description,
            claim_amount,sum_assured_at_filing,bank_account)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [claimNumber, policy_id, req.user.id, incident_date, description,
         claim_amount, policy.sum_assured, bank_account||null]
      )
      const claim = claimRes.rows[0]

      // Initial status history
      await client.query(
        `INSERT INTO claim_status_history (claim_id,from_status,to_status,changed_by,note)
         VALUES ($1,NULL,'submitted',$2,'Claim filed by policyholder')`,
        [claim.id, req.user.id]
      )

      // Save uploaded documents
      const docTypesArr = doc_types ? JSON.parse(doc_types) : []
      if (req.files?.length) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i]
          await client.query(
            `INSERT INTO claim_documents
               (claim_id,file_path,file_name,file_size,mime_type,doc_type)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [claim.id, file.path, file.originalname, file.size,
             file.mimetype, docTypesArr[i] || 'other']
          )
        }
      }

      await client.query('COMMIT')
      audit(req.user.id, 'claim_filed', 'claim', claim.id,
        { claim_number: claimNumber, amount: claim_amount }, req.ip)

      res.status(201).json({
        message: 'Claim submitted. Our adjuster will contact you within 24 hours.',
        claim,
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })
)

// ── PUT /api/claims/:id/status — adjuster state machine ───
router.put('/:id/status', authenticate, requireAdjuster, [
  body('status').isIn(['under_review','approved','rejected','disbursed']),
  body('note').optional().trim(),
  body('approved_amount').optional().isFloat({ min: 0 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { status: newStatus, note, approved_amount } = req.body

  const claimRes = await query(
    `SELECT c.*,u.email,u.full_name FROM claims c
     JOIN users u ON c.user_id=u.id WHERE c.id=$1`,
    [req.params.id]
  )
  const claim = claimRes.rows[0]
  if (!claim) return res.status(404).json({ error: 'Claim not found' })

  // Enforce state machine
  const allowed = TRANSITIONS[claim.status] || []
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({
      error: `Cannot transition '${claim.status}' → '${newStatus}'`,
      allowed_transitions: allowed,
    })
  }

  // Approved amount cannot exceed sum assured at filing
  if (newStatus === 'approved' && approved_amount) {
    if (parseFloat(approved_amount) > parseFloat(claim.sum_assured_at_filing)) {
      return res.status(400).json({
        error: `Approved amount cannot exceed sum assured of ₹${Number(claim.sum_assured_at_filing).toLocaleString('en-IN')}`,
      })
    }
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')

    await client.query(
      `UPDATE claims
       SET status=$1, assigned_to=$2, resolution_note=COALESCE($3,resolution_note),
           approved_amount=COALESCE($4,approved_amount),
           disbursed_at=CASE WHEN $1='disbursed' THEN NOW() ELSE disbursed_at END,
           assigned_at=CASE WHEN $1='under_review' THEN NOW() ELSE assigned_at END
       WHERE id=$5`,
      [newStatus, req.user.id, note||null, approved_amount||null, claim.id]
    )

    await client.query(
      `INSERT INTO claim_status_history (claim_id,from_status,to_status,changed_by,note)
       VALUES ($1,$2,$3,$4,$5)`,
      [claim.id, claim.status, newStatus, req.user.id, note||null]
    )

    // If claim approved/disbursed, update NCB (reset to 0 for vehicle)
    if (newStatus === 'approved') {
      const policyRes = await client.query('SELECT * FROM policies WHERE id=$1', [claim.policy_id])
      const pol = policyRes.rows[0]
      if (pol && pol.type === 'vehicle' && pol.ncb_percent > 0) {
        const oldNCB = pol.ncb_percent
        await client.query(
          `UPDATE policies SET ncb_percent=0, claim_free_years=0, last_ncb_updated=NOW() WHERE id=$1`,
          [pol.id]
        )
        await client.query(
          `INSERT INTO ncb_history (policy_id,user_id,old_ncb,new_ncb,reason,changed_by)
           VALUES ($1,$2,$3,0,'claim_filed',$4)`,
          [pol.id, pol.user_id, oldNCB, req.user.id]
        )
      }
    }

    await client.query('COMMIT')

    sendClaimStatusEmail(
      { email: claim.email, full_name: claim.full_name },
      { ...claim, resolution_note: note },
      newStatus
    ).catch(e => console.error('Email:', e.message))

    audit(req.user.id, 'claim_status_changed', 'claim', claim.id,
      { from: claim.status, to: newStatus }, req.ip)

    res.json({ message: `Claim status updated to '${newStatus}'` })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}))

// ── GET /api/claims/:id/documents/:docId — download file ──
router.get('/:id/documents/:docId', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT cd.*, c.user_id FROM claim_documents cd
     JOIN claims c ON cd.claim_id=c.id
     WHERE cd.id=$1 AND cd.claim_id=$2`,
    [req.params.docId, req.params.id]
  )
  const doc = result.rows[0]
  if (!doc) return res.status(404).json({ error: 'Document not found' })

  // Customers can only download their own documents
  if (req.user.role === 'customer' && doc.user_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' })
  if (!fs.existsSync(doc.file_path))
    return res.status(404).json({ error: 'File not found on server' })

  res.download(doc.file_path, doc.file_name)
}))

export default router
