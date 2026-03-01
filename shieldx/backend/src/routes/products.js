import express from 'express'
import { body, validationResult } from 'express-validator'
import { query } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { audit } from '../middleware/audit.js'

const router = express.Router()

// ── GET /api/products — public ────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { type } = req.query
  const params = []
  let where = 'WHERE is_active=TRUE'
  if (type) { params.push(type); where += ` AND type=$${params.length}` }

  const result = await query(
    `SELECT id,name,type,description,base_premium,min_age,max_age,
            max_coverage,coverage_details,terms_months,is_active
     FROM products ${where} ORDER BY type,name`,
    params
  )
  res.json({ products: result.rows })
}))

// ── GET /api/products/:id — public ───────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM products WHERE id=$1', [req.params.id])
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' })
  res.json({ product: result.rows[0] })
}))

// ── POST /api/products — admin only ──────────────────────
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty(),
  body('type').isIn(['life','health','vehicle']),
  body('base_premium').isNumeric(),
  body('min_age').isInt({ min: 0 }),
  body('max_age').isInt({ max: 120 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, type, description, base_premium, min_age, max_age, max_coverage, coverage_details, terms_months } = req.body

  const result = await query(
    `INSERT INTO products
       (name,type,description,base_premium,min_age,max_age,max_coverage,coverage_details,terms_months,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [name, type, description, base_premium, min_age, max_age, max_coverage||null,
     coverage_details ? JSON.stringify(coverage_details) : null, terms_months||null, req.user.id]
  )
  audit(req.user.id, 'product_created', 'product', result.rows[0].id, { name, type }, req.ip)
  res.status(201).json({ product: result.rows[0] })
}))

// ── PUT /api/products/:id — admin only ───────────────────
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { name, description, base_premium, min_age, max_age, max_coverage, coverage_details, is_active } = req.body

  const result = await query(
    `UPDATE products
     SET name=COALESCE($1,name), description=COALESCE($2,description),
         base_premium=COALESCE($3,base_premium), min_age=COALESCE($4,min_age),
         max_age=COALESCE($5,max_age), max_coverage=COALESCE($6,max_coverage),
         coverage_details=COALESCE($7,coverage_details), is_active=COALESCE($8,is_active)
     WHERE id=$9 RETURNING *`,
    [name||null, description||null, base_premium||null, min_age||null, max_age||null,
     max_coverage||null, coverage_details ? JSON.stringify(coverage_details) : null,
     is_active!=null ? is_active : null, req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' })
  audit(req.user.id, 'product_updated', 'product', req.params.id, { is_active }, req.ip)
  res.json({ product: result.rows[0] })
}))

export default router
