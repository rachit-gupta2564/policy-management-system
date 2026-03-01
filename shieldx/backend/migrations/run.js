import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shieldx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

async function run() {
  const client = await pool.connect()
  try {
    console.log('🚀 Running ShieldX migrations...\n')
    for (const file of ['001_schema.sql', '002_seed.sql']) {
      console.log(`  ▶ ${file}`)
      await client.query(readFileSync(join(__dirname, file), 'utf8'))
      console.log(`  ✅ done\n`)
    }
    console.log('✅ All migrations complete!\n')
    console.log('Default accounts:')
    console.log('  admin@shieldx.in        / Admin@123')
    console.log('  underwriter@shieldx.in  / Admin@123')
    console.log('  adjuster@shieldx.in     / Admin@123')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}
run()
