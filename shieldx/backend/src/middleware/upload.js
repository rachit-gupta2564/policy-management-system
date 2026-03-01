import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const MAX_MB   = parseInt(process.env.MAX_FILE_SIZE_MB || '5')
const BASE_DIR = process.env.UPLOAD_DIR || './uploads'

// Ensure subdirs exist on startup
;['kyc', 'claims', 'certificates'].forEach(d => {
  const p = path.join(BASE_DIR, d)
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
})

const storage = (sub) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(BASE_DIR, sub)),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
})

const fileFilter = (req, file, cb) => {
  const ok = ['image/jpeg','image/png','image/webp','application/pdf'].includes(file.mimetype)
  ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP, PDF allowed'), false)
}

const limits = { fileSize: MAX_MB * 1024 * 1024 }

export const uploadKYC       = multer({ storage: storage('kyc'),    fileFilter, limits }).single('document')
export const uploadClaimDocs = multer({ storage: storage('claims'), fileFilter, limits }).array('documents', 10)

// Wrap multer so errors flow to express error handler
export const handleUpload = (fn) => (req, res, next) => fn(req, res, (err) => err ? next(err) : next())
