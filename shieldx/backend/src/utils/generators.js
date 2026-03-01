import { query } from '../config/db.js'

export async function generatePolicyNumber(type) {
  const prefix = { life: 'LI', health: 'HI', vehicle: 'VI' }[type] || 'XX'
  const year   = new Date().getFullYear()
  const result = await query(
    `SELECT COUNT(*) FROM policies WHERE type=$1 AND EXTRACT(YEAR FROM created_at)=$2`,
    [type, year]
  )
  const seq = String(parseInt(result.rows[0].count) + 1).padStart(5, '0')
  return `SHX-${prefix}-${year}-${seq}`
}

export async function generateClaimNumber() {
  const year   = new Date().getFullYear()
  const result = await query(
    `SELECT COUNT(*) FROM claims WHERE EXTRACT(YEAR FROM created_at)=$1`,
    [year]
  )
  const seq = String(parseInt(result.rows[0].count) + 1).padStart(5, '0')
  return `CLM-${year}-${seq}`
}
