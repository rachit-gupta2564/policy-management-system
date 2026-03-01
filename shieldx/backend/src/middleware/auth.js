import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { query } from '../config/db.js'

// ── JWT Auth ──────────────────────────────────────────────
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' })

    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)

    const result = await query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    )
    if (!result.rows[0] || !result.rows[0].is_active)
      return res.status(401).json({ error: 'User not found or deactivated' })

    req.user = result.rows[0]
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ── Role guards ───────────────────────────────────────────
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ error: `Access denied. Required: ${roles.join(' or ')}` })
  next()
}

export const requireAdmin       = requireRole('admin')
export const requireUnderwriter = requireRole('admin', 'underwriter')
export const requireAdjuster    = requireRole('admin', 'adjuster')
export const requireStaff       = requireRole('admin', 'underwriter', 'adjuster')

// ── Rate limiters ─────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)    || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message:  { error: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true,
})
