import express from 'express'
import { query } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate } from '../middleware/auth.js'
import { createPaymentOrder, verifyWebhookSignature } from '../utils/razorpay.js'
import { audit } from '../middleware/audit.js'

const router = express.Router()

// ── POST /api/payments/create-order ──────────────────────
// Creates a Razorpay order before the user enters card details
router.post('/create-order', authenticate, asyncHandler(async (req, res) => {
  const { amount, policy_id } = req.body
  if (!amount || !policy_id) {
    return res.status(400).json({ error: 'amount and policy_id required' })
  }
  const order = await createPaymentOrder(parseFloat(amount), policy_id, req.user.id)
  res.json({ order })
}))

// ── GET /api/payments/my ──────────────────────────────────
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT py.*,p.policy_number,p.type
     FROM payments py JOIN policies p ON py.policy_id=p.id
     WHERE py.user_id=$1 ORDER BY py.created_at DESC`,
    [req.user.id]
  )
  res.json({ payments: result.rows })
}))

// ── POST /api/payments/webhook — Razorpay webhook ─────────
// Register this URL in Razorpay dashboard → Webhooks
// Use raw body (before JSON parsing) for signature verification
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature']
    if (!signature) return res.status(400).json({ error: 'Missing signature' })

    // Verify authenticity
    const valid = verifyWebhookSignature(req.body, signature)
    if (!valid) {
      console.warn('⚠️ Invalid Razorpay webhook signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const event = JSON.parse(req.body)
    const { event: eventType, payload } = event

    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity
      // Update payment record
      await query(
        `UPDATE payments
         SET status='success', razorpay_payment_id=$1, paid_at=NOW(), gateway_response=$2
         WHERE razorpay_order_id=$3`,
        [payment.id, JSON.stringify(payment), payment.order_id]
      )
      audit(null, 'payment_captured_webhook', 'payment', null,
        { payment_id: payment.id, order_id: payment.order_id }, 'razorpay')
    }

    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity
      await query(
        `UPDATE payments SET status='failed', gateway_response=$1 WHERE razorpay_order_id=$2`,
        [JSON.stringify(payment), payment.order_id]
      )
    }

    if (eventType === 'refund.processed') {
      const refund = payload.refund.entity
      await query(
        `UPDATE payments SET status='refunded', gateway_response=$1 WHERE razorpay_payment_id=$2`,
        [JSON.stringify(refund), refund.payment_id]
      )
    }

    res.json({ received: true })
  })
)

export default router
