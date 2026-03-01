import express from 'express'
import { body, validationResult } from 'express-validator'
import { calculatePremium } from '../utils/premium.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// ── POST /api/calculator/premium — public ────────────────
router.post('/premium', [
  body('type').isIn(['vehicle','health','life']).withMessage('type must be vehicle, health, or life'),
  body('params').isObject().withMessage('params must be an object'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { type, params } = req.body
  const result = calculatePremium(type, params)

  res.json({
    type,
    ...result,
    monthlyEstimate: Math.round(result.totalPremium / 12),
  })
}))

export default router
