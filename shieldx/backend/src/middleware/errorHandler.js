export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

export const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message)
  if (process.env.NODE_ENV === 'development') console.error(err.stack)

  if (err.code === '23505') return res.status(409).json({ error: 'Duplicate entry', detail: err.detail })
  if (err.code === '23503') return res.status(400).json({ error: 'Referenced record not found' })
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' })
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' })

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFound = (req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
