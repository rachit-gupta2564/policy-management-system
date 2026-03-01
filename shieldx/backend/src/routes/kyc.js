import express from 'express'
import fs from 'fs'
import { query } from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authenticate, requireUnderwriter } from '../middleware/auth.js'
import { handleUpload, uploadKYC } from '../middleware/upload.js'
import { audit } from '../middleware/audit.js'

const router = express.Router()

const VALID_DOC_TYPES = ['aadhaar','pan','driving_license','passport','address_proof']

// ── GET /api/kyc/my ───────────────────────────────────────
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id,doc_type,file_name,file_size,mime_type,status,verified_at,rejection_note,created_at
     FROM kyc_documents WHERE user_id=$1 ORDER BY doc_type`,
    [req.user.id]
  )
  res.json({ documents: result.rows })
}))

// ── GET /api/kyc/status — summary for current user ────────
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT doc_type, status, verified_at FROM kyc_documents WHERE user_id=$1`,
    [req.user.id]
  )
  const verified_count = result.rows.filter(r => r.status === 'verified').length
  res.json({
    documents:      result.rows,
    verified_count,
    kyc_complete:   verified_count >= 2,  // need at least 2 verified docs
    required_types: VALID_DOC_TYPES,
  })
}))

// ── POST /api/kyc/upload ──────────────────────────────────
router.post('/upload',
  authenticate,
  handleUpload(uploadKYC),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const { doc_type } = req.body
    if (!VALID_DOC_TYPES.includes(doc_type)) {
      return res.status(400).json({ error: `doc_type must be one of: ${VALID_DOC_TYPES.join(', ')}` })
    }

    // Upsert: if doc of same type exists, replace it (reset to pending)
    const result = await query(
      `INSERT INTO kyc_documents
         (user_id,doc_type,file_path,file_name,file_size,mime_type)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id,doc_type)
       DO UPDATE SET
         file_path=$3, file_name=$4, file_size=$5, mime_type=$6,
         status='pending', verified_by=NULL, verified_at=NULL, rejection_note=NULL
       RETURNING *`,
      [req.user.id, doc_type, req.file.path, req.file.originalname, req.file.size, req.file.mimetype]
    )
    audit(req.user.id, 'kyc_uploaded', 'kyc', result.rows[0].id, { doc_type }, req.ip)
    res.status(201).json({ message: 'Document uploaded. Pending verification.', document: result.rows[0] })
  })
)

// ── GET /api/kyc/pending — staff view ─────────────────────
router.get('/pending', authenticate, requireUnderwriter, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT kd.*,u.full_name,u.email FROM kyc_documents kd
     JOIN users u ON kd.user_id=u.id
     WHERE kd.status='pending' ORDER BY kd.created_at ASC`
  )
  res.json({ documents: result.rows })
}))

// ── PUT /api/kyc/:id/verify — staff action ────────────────
router.put('/:id/verify', authenticate, requireUnderwriter, asyncHandler(async (req, res) => {
  const { action, rejection_note } = req.body
  if (!['verify','reject'].includes(action))
    return res.status(400).json({ error: 'Action must be verify or reject' })
  if (action === 'reject' && !rejection_note)
    return res.status(400).json({ error: 'rejection_note required when rejecting' })

  const result = await query(
    `UPDATE kyc_documents
     SET status=$1, verified_by=$2, verified_at=NOW(), rejection_note=$3
     WHERE id=$4 RETURNING *`,
    [action === 'verify' ? 'verified' : 'rejected', req.user.id, rejection_note||null, req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Document not found' })

  audit(req.user.id, `kyc_${action}d`, 'kyc', req.params.id, { rejection_note }, req.ip)
  res.json({ message: `Document ${action}d`, document: result.rows[0] })
}))

// ── GET /api/kyc/:id/download — download KYC file ─────────
router.get('/:id/download', authenticate, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM kyc_documents WHERE id=$1',
    [req.params.id]
  )
  const doc = result.rows[0]
  if (!doc) return res.status(404).json({ error: 'Document not found' })

  // Only owner or staff can download
  if (req.user.role === 'customer' && doc.user_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' })
  if (!fs.existsSync(doc.file_path))
    return res.status(404).json({ error: 'File not found on server' })

  audit(req.user.id, 'kyc_downloaded', 'kyc', doc.id, null, req.ip)
  res.download(doc.file_path, doc.file_name)
}))

export default router
