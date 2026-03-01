import Razorpay from 'razorpay'
import crypto from 'crypto'

// Lazily initialise so server starts even without Razorpay keys (dev mode)
let _rz = null
function getRazorpay() {
  if (!_rz) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
    }
    _rz = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return _rz
}

// ── Create Razorpay order ─────────────────────────────────
// Call this BEFORE redirecting user to payment page
export async function createPaymentOrder(amountInRupees, policyId, userId) {
  const rz = getRazorpay()

  // Razorpay amounts are in paise (1 rupee = 100 paise)
  const order = await rz.orders.create({
    amount:          Math.round(amountInRupees * 100),
    currency:        'INR',
    receipt:         `policy_${policyId.slice(0, 8)}`,
    notes: {
      policy_id: policyId,
      user_id:   userId,
    },
  })

  return {
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    process.env.RAZORPAY_KEY_ID, // send to frontend
  }
}

// ── Verify webhook/payment signature ─────────────────────
// Call this AFTER user completes payment
export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const body    = `${razorpay_order_id}|${razorpay_payment_id}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  return expected === razorpay_signature
}

// ── Verify webhook signature (from Razorpay dashboard) ───
export function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}

// ── Fetch payment details from Razorpay ──────────────────
export async function fetchPayment(paymentId) {
  return getRazorpay().payments.fetch(paymentId)
}

// ── Initiate refund ───────────────────────────────────────
export async function initiateRefund(paymentId, amountInRupees, reason = 'Policy cancelled') {
  const rz = getRazorpay()
  return rz.payments.refund(paymentId, {
    amount: Math.round(amountInRupees * 100),
    notes:  { reason },
  })
}
