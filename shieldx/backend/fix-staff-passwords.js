// ============================================================
// fix-staff-passwords.js
// Run this ONCE to fix staff account passwords in the DB:
//   node fix-staff-passwords.js
// ============================================================

import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'shieldx',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

async function fix() {
  const client = await pool.connect()
  try {
    console.log('\n🔧 ShieldX — Staff Password Fix\n')

    const PASSWORD = 'Admin@123'
    const hash = await bcrypt.hash(PASSWORD, 10)
    console.log(`✅ Generated hash for "${PASSWORD}"`)
    console.log(`   Hash: ${hash}\n`)

    const staff = [
      { full_name: 'Raj Singh',    email: 'admin@shieldx.in',       role: 'admin' },
      { full_name: 'Vikram Shah',  email: 'underwriter@shieldx.in', role: 'underwriter' },
      { full_name: 'Priya Kapoor', email: 'adjuster@shieldx.in',    role: 'adjuster' },
    ]

    for (const u of staff) {
      // Upsert: update if exists, insert if not
      const res = await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
         ON CONFLICT (email) DO UPDATE
           SET password_hash  = EXCLUDED.password_hash,
               role           = EXCLUDED.role,
               email_verified = TRUE,
               is_active      = TRUE
         RETURNING id, email, role`,
        [u.full_name, u.email, null, hash, u.role]
      )
      console.log(`✅ ${u.role.padEnd(12)} ${u.email}  (id: ${res.rows[0].id})`)
    }

    // Verify by doing a test compare
    console.log('\n🔍 Verifying passwords...')
    const testResult = await client.query(
      `SELECT email, role, password_hash FROM users WHERE email = ANY($1)`,
      [staff.map(u => u.email)]
    )

    for (const row of testResult.rows) {
      const ok = await bcrypt.compare(PASSWORD, row.password_hash)
      const icon = ok ? '✅' : '❌'
      console.log(`${icon} ${row.email} — login will ${ok ? 'WORK' : 'FAIL'}`)
    }

    console.log('\n╔══════════════════════════════════════════════════╗')
    console.log('║  ✅ All staff passwords have been fixed!         ║')
    console.log('╠══════════════════════════════════════════════════╣')
    console.log('║  Email                      Password             ║')
    console.log('║  admin@shieldx.in           Admin@123            ║')
    console.log('║  underwriter@shieldx.in     Admin@123            ║')
    console.log('║  adjuster@shieldx.in        Admin@123            ║')
    console.log('╚══════════════════════════════════════════════════╝\n')

  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

fix()
