import { query } from '../config/db.js'

export const audit = async (userId, action, entityType, entityId, details, ip) => {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ip]
    )
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}
