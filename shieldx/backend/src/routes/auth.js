import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { body, validationResult } from 'express-validator'
import { query } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate, authLimiter } from '../middleware/auth.js'
import { audit } from '../middleware/audit.js'
import {
  sendWelcomeEmail, sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/email.js'

const router = express.Router()

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

// ── POST /api/auth/register ───────────────────────────────
router.post('/register',
  authLimiter,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Minimum 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Must contain uppercase, lowercase, and a number'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { full_name, email, password, phone, date_of_birth, gender, address } = req.body

    const existing = await query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' })

    const password_hash  = await bcrypt.hash(password, 10)
    const verify_token   = crypto.randomBytes(32).toString('hex')

    const result = await query(
      `INSERT INTO users
         (full_name, email, phone, password_hash, date_of_birth, gender, address, verify_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, full_name, email, phone, role, created_at`,
      [full_name, email, phone || null, password_hash,
       date_of_birth || null, gender || null, address || null, verify_token]
    )

    const user  = result.rows[0]
    const token = signToken(user)

    audit(user.id, 'user_registered', 'user', user.id, { email }, req.ip)

    // Non-blocking emails
    sendWelcomeEmail(user).catch(e => console.error('Welcome email:', e.message))
    sendVerificationEmail(user, verify_token).catch(e => console.error('Verify email:', e.message))

    res.status(201).json({
      message: 'Account created. Please verify your email.',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    })
  })
)

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password } = req.body

    const result = await query(
      'SELECT id, full_name, email, phone, password_hash, role, is_active FROM users WHERE email=$1',
      [email]
    )
    const user = result.rows[0]

    // Use consistent timing to prevent user enumeration
    const fakeHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345'
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, fakeHash) && false

    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })
    if (!user.is_active) return res.status(403).json({ error: 'Account deactivated. Contact support.' })

    const token = signToken(user)
    audit(user.id, 'user_login', 'user', user.id, null, req.ip)

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    })
  })
)

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, full_name, email, phone, gender, date_of_birth, address,
            role, email_verified, created_at
     FROM users WHERE id=$1`,
    [req.user.id]
  )
  res.json({ user: result.rows[0] })
}))

// ── PUT /api/auth/me ──────────────────────────────────────
router.put('/me', authenticate, [
  body('full_name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone('en-IN'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { full_name, phone, gender, date_of_birth, address } = req.body
  const result = await query(
    `UPDATE users
     SET full_name=COALESCE($1,full_name), phone=COALESCE($2,phone),
         gender=COALESCE($3,gender), date_of_birth=COALESCE($4,date_of_birth),
         address=COALESCE($5,address)
     WHERE id=$6
     RETURNING id, full_name, email, phone, gender, date_of_birth, address`,
    [full_name||null, phone||null, gender||null, date_of_birth||null, address||null, req.user.id]
  )
  audit(req.user.id, 'profile_updated', 'user', req.user.id, null, req.ip)
  res.json({ user: result.rows[0] })
}))

// ── POST /api/auth/verify-email ───────────────────────────
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Token required' })

  const result = await query(
    `UPDATE users SET email_verified=TRUE, verify_token=NULL
     WHERE verify_token=$1 AND email_verified=FALSE
     RETURNING id, email`,
    [token]
  )
  if (!result.rows[0]) return res.status(400).json({ error: 'Invalid or already used token' })
  audit(result.rows[0].id, 'email_verified', 'user', result.rows[0].id, null, req.ip)
  res.json({ message: 'Email verified successfully' })
}))

// ── POST /api/auth/forgot-password ───────────────────────
router.post('/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email } = req.body
    const result = await query('SELECT id, full_name, email FROM users WHERE email=$1', [email])
    const user = result.rows[0]

    // Always return 200 to prevent user enumeration
    if (user) {
      const token   = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES)||30) * 60 * 1000)

      await query(
        'UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE id=$3',
        [token, expires, user.id]
      )
      sendPasswordResetEmail(user, token).catch(e => console.error('Reset email:', e.message))
      audit(user.id, 'password_reset_requested', 'user', user.id, null, req.ip)
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  })
)

// ── POST /api/auth/reset-password ────────────────────────
router.post('/reset-password',
  authLimiter,
  [
    body('token').notEmpty(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Must contain uppercase, lowercase, and a number'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { token, password } = req.body

    const result = await query(
      `SELECT id FROM users
       WHERE reset_token=$1 AND reset_token_expires > NOW()`,
      [token]
    )
    if (!result.rows[0]) return res.status(400).json({ error: 'Invalid or expired reset token' })

    const hash = await bcrypt.hash(password, 10)
    await query(
      'UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2',
      [hash, result.rows[0].id]
    )
    audit(result.rows[0].id, 'password_reset', 'user', result.rows[0].id, null, req.ip)
    res.json({ message: 'Password reset successfully. Please log in.' })
  })
)

// ── PUT /api/auth/change-password ────────────────────────
router.put('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { current_password, new_password } = req.body
  const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id])
  const valid  = await bcrypt.compare(current_password, result.rows[0].password_hash)
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const hash = await bcrypt.hash(new_password, 10)
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id])
  audit(req.user.id, 'password_changed', 'user', req.user.id, null, req.ip)
  res.json({ message: 'Password changed successfully' })
}))

export default router
