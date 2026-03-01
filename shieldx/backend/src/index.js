import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes       from './routes/auth.js'
import productRoutes    from './routes/products.js'
import calculatorRoutes from './routes/calculator.js'
import policyRoutes     from './routes/policies.js'
import claimRoutes      from './routes/claims.js'
import kycRoutes        from './routes/kyc.js'
import paymentRoutes    from './routes/payments.js'
import adminRoutes      from './routes/admin.js'

import { globalLimiter } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { startAllCronJobs } from './jobs/cron.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 5000

// ── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow file downloads
}))

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',  // Vite fallback port
]
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: Origin '${origin}' not allowed`))
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ── Body parsing ──────────────────────────────────────────
// NOTE: webhook route needs raw body — must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Rate limiting (global) ────────────────────────────────
app.use('/api', globalLimiter)

// ── Static uploads (dev only — use S3/CDN in production) ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
    version:   '2.0.0',
  })
})

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/products',   productRoutes)
app.use('/api/calculator', calculatorRoutes)
app.use('/api/policies',   policyRoutes)
app.use('/api/claims',     claimRoutes)
app.use('/api/kyc',        kycRoutes)
app.use('/api/payments',   paymentRoutes)
app.use('/api/admin',      adminRoutes)

// ── 404 + Error handlers ──────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   ShieldX API Server v2.0                            ║
║   http://localhost:${PORT}                               ║
║   ENV: ${(process.env.NODE_ENV || 'development').padEnd(46)}║
╠══════════════════════════════════════════════════════╣
║   Routes:                                            ║
║   POST  /api/auth/register      POST /api/auth/login ║
║   GET   /api/policies/my        POST /api/policies   ║
║   GET   /api/claims/my          POST /api/claims     ║
║   POST  /api/kyc/upload         GET  /api/products   ║
║   POST  /api/payments/webhook   GET  /api/admin/*    ║
╚══════════════════════════════════════════════════════╝
  `)

  // Start background cron jobs
  startAllCronJobs()
})

export default app
