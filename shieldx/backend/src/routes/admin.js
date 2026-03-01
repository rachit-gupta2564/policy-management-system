import express from 'express'
import { query } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth.js'
import { audit } from '../middleware/audit.js'

const router = express.Router()

// ── GET /api/admin/analytics ──────────────────────────────
router.get('/analytics', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const [policies, claims, premiums, byType, monthly, recentAudit, kycPending] = await Promise.all([
    query(`SELECT COUNT(*) as total,
                  COUNT(*) FILTER (WHERE status='active')  as active,
                  COUNT(*) FILTER (WHERE status='pending') as pending,
                  COUNT(*) FILTER (WHERE status='expired') as expired
           FROM policies`),

    query(`SELECT COUNT(*) as total,
                  COUNT(*) FILTER (WHERE status='submitted')    as submitted,
                  COUNT(*) FILTER (WHERE status='under_review') as under_review,
                  COUNT(*) FILTER (WHERE status='approved')     as approved,
                  COUNT(*) FILTER (WHERE status='disbursed')    as disbursed,
                  COUNT(*) FILTER (WHERE status='rejected')     as rejected,
                  COALESCE(SUM(approved_amount) FILTER (WHERE status='disbursed'),0) as total_disbursed
           FROM claims`),

    query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count
           FROM payments WHERE status='success'`),

    query(`SELECT type, COUNT(*) as count, COALESCE(SUM(total_premium),0) as total_premium
           FROM policies WHERE status='active' GROUP BY type`),

    query(`SELECT TO_CHAR(DATE_TRUNC('month',paid_at),'Mon YYYY') as month,
                  SUM(amount) as total, COUNT(*) as count
           FROM payments
           WHERE status='success' AND paid_at >= NOW()-INTERVAL '12 months'
           GROUP BY DATE_TRUNC('month',paid_at)
           ORDER BY DATE_TRUNC('month',paid_at)`),

    query(`SELECT al.action,al.entity_type,al.created_at,u.full_name
           FROM audit_log al LEFT JOIN users u ON al.user_id=u.id
           ORDER BY al.created_at DESC LIMIT 20`),

    query(`SELECT COUNT(*) as count FROM kyc_documents WHERE status='pending'`),
  ])

  res.json({
    policies: {
      total:   +policies.rows[0].total,
      active:  +policies.rows[0].active,
      pending: +policies.rows[0].pending,
      expired: +policies.rows[0].expired,
    },
    claims: {
      total:          +claims.rows[0].total,
      submitted:      +claims.rows[0].submitted,
      under_review:   +claims.rows[0].under_review,
      approved:       +claims.rows[0].approved,
      disbursed:      +claims.rows[0].disbursed,
      rejected:       +claims.rows[0].rejected,
      total_disbursed: +claims.rows[0].total_disbursed,
    },
    premiums: {
      total_collected: +premiums.rows[0].total,
      payment_count:   +premiums.rows[0].count,
    },
    by_type:         byType.rows,
    monthly_premium: monthly.rows,
    recent_audit:    recentAudit.rows,
    kyc_pending:     +kycPending.rows[0].count,
  })
}))

// ── GET /api/admin/users ──────────────────────────────────
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { role, page=1, limit=20 } = req.query
  const params = []
  let where = 'WHERE 1=1'
  if (role) { params.push(role); where += ` AND role=$${params.length}` }
  params.push(limit, (page-1)*limit)

  const result = await query(
    `SELECT id,full_name,email,phone,role,is_active,email_verified,created_at
     FROM users ${where} ORDER BY created_at DESC
     LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  )
  res.json({ users: result.rows })
}))

// ── PUT /api/admin/users/:id/role ─────────────────────────
router.put('/users/:id/role', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { role } = req.body
  if (!['customer','underwriter','adjuster','admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role' })
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'Cannot change your own role' })

  const result = await query(
    'UPDATE users SET role=$1 WHERE id=$2 RETURNING id,full_name,email,role',
    [role, req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
  audit(req.user.id, 'user_role_changed', 'user', req.params.id, { role }, req.ip)
  res.json({ user: result.rows[0] })
}))

// ── PUT /api/admin/users/:id/deactivate ───────────────────
router.put('/users/:id/deactivate', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'Cannot deactivate yourself' })

  const result = await query(
    'UPDATE users SET is_active=FALSE WHERE id=$1 RETURNING id,full_name,email',
    [req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
  audit(req.user.id, 'user_deactivated', 'user', req.params.id, null, req.ip)
  res.json({ message: 'User deactivated', user: result.rows[0] })
}))

// ── GET /api/admin/audit ──────────────────────────────────
router.get('/audit', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page=1, limit=50, entity_type } = req.query
  const params = []
  let where = 'WHERE 1=1'
  if (entity_type) { params.push(entity_type); where += ` AND al.entity_type=$${params.length}` }
  params.push(limit, (page-1)*limit)

  const result = await query(
    `SELECT al.*,u.full_name,u.email FROM audit_log al
     LEFT JOIN users u ON al.user_id=u.id
     ${where} ORDER BY al.created_at DESC
     LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  )
  res.json({ logs: result.rows })
}))

// ── GET /api/admin/ncb-history ────────────────────────────
router.get('/ncb-history', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT nh.*,p.policy_number,p.type,u.full_name,u.email
     FROM ncb_history nh
     JOIN policies p ON nh.policy_id=p.id
     JOIN users u    ON nh.user_id=u.id
     ORDER BY nh.created_at DESC LIMIT 50`
  )
  res.json({ history: result.rows })
}))

export default router
