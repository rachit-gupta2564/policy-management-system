import cron from 'node-cron'
import { query } from '../config/db.js'
import { sendRenewalReminderEmail } from '../utils/email.js'

// ── JOB 1: Send renewal reminder emails ───────────────────
// Runs every day at 8:00 AM
export function startRenewalReminderJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Running renewal reminder job`)
    try {
      // Find all unsent reminders that are due today or overdue
      const result = await query(
        `SELECT rr.*, p.policy_number, p.end_date, p.type,
                u.full_name, u.email
         FROM renewal_reminders rr
         JOIN policies p ON rr.policy_id=p.id
         JOIN users u    ON rr.user_id=u.id
         WHERE rr.sent=FALSE
           AND rr.reminder_date <= CURRENT_DATE
           AND p.status='active'`
      )

      console.log(`[CRON] Found ${result.rows.length} pending renewal reminders`)

      for (const reminder of result.rows) {
        try {
          const daysLeft = Math.ceil(
            (new Date(reminder.end_date) - new Date()) / (1000 * 60 * 60 * 24)
          )

          await sendRenewalReminderEmail(
            { full_name: reminder.full_name, email: reminder.email },
            { policy_number: reminder.policy_number, end_date: reminder.end_date, id: reminder.policy_id },
            Math.max(daysLeft, 0)
          )

          // Mark as sent
          await query(
            'UPDATE renewal_reminders SET sent=TRUE, sent_at=NOW() WHERE id=$1',
            [reminder.id]
          )

          console.log(`[CRON] Reminder sent → ${reminder.email} | ${reminder.policy_number} | ${daysLeft} days left`)
        } catch (err) {
          console.error(`[CRON] Failed to send reminder for policy ${reminder.policy_number}:`, err.message)
          // Don't mark as sent — will retry next run
        }
      }
    } catch (err) {
      console.error('[CRON] Renewal reminder job failed:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  console.log('✅ Renewal reminder cron scheduled (daily 8:00 AM IST)')
}

// ── JOB 2: Auto-expire policies past their end_date ───────
// Runs every day at midnight
export function startPolicyExpiryJob() {
  cron.schedule('0 0 * * *', async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Running policy expiry job`)
    try {
      const result = await query(
        `UPDATE policies
         SET status='expired'
         WHERE status='active' AND end_date < CURRENT_DATE
         RETURNING id, policy_number, user_id`
      )

      if (result.rows.length > 0) {
        console.log(`[CRON] Expired ${result.rows.length} policies:`,
          result.rows.map(p => p.policy_number).join(', ')
        )
      } else {
        console.log('[CRON] No policies to expire today')
      }
    } catch (err) {
      console.error('[CRON] Policy expiry job failed:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  console.log('✅ Policy expiry cron scheduled (daily midnight IST)')
}

// ── JOB 3: Auto-increment NCB for claim-free policies ─────
// Runs on 1st of every month at 6:00 AM
// Finds vehicle policies that completed a full year without claims
export function startNCBUpdateJob() {
  cron.schedule('0 6 1 * *', async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Running NCB update job`)
    try {
      // Find active vehicle policies where:
      // 1. start_date was exactly 1 year ago (anniversary)
      // 2. No approved/disbursed claims in the past year
      const eligibleResult = await query(
        `SELECT p.id, p.user_id, p.policy_number, p.ncb_percent, p.claim_free_years
         FROM policies p
         WHERE p.type='vehicle'
           AND p.status='active'
           AND DATE_PART('month', p.start_date) = DATE_PART('month', CURRENT_DATE)
           AND DATE_PART('day',   p.start_date) = DATE_PART('day',   CURRENT_DATE)
           AND NOT EXISTS (
             SELECT 1 FROM claims c
             WHERE c.policy_id=p.id
               AND c.status NOT IN ('rejected')
               AND c.created_at >= NOW() - INTERVAL '1 year'
           )`
      )

      console.log(`[CRON] ${eligibleResult.rows.length} policies eligible for NCB upgrade`)

      for (const pol of eligibleResult.rows) {
        const newClaimFreeYears = Math.min((pol.claim_free_years || 0) + 1, 5)
        const NCB_SCHEDULE = { 0:0, 1:20, 2:25, 3:35, 4:45, 5:50 }
        const newNCB        = NCB_SCHEDULE[newClaimFreeYears]

        if (newNCB > pol.ncb_percent) {
          await query(
            `UPDATE policies
             SET ncb_percent=$1, claim_free_years=$2, last_ncb_updated=NOW()
             WHERE id=$3`,
            [newNCB, newClaimFreeYears, pol.id]
          )

          await query(
            `INSERT INTO ncb_history (policy_id,user_id,old_ncb,new_ncb,reason)
             VALUES ($1,$2,$3,$4,'claim_free_year')`,
            [pol.id, pol.user_id, pol.ncb_percent, newNCB]
          )

          console.log(`[CRON] NCB updated: ${pol.policy_number} | ${pol.ncb_percent}% → ${newNCB}%`)
        }
      }
    } catch (err) {
      console.error('[CRON] NCB update job failed:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  console.log('✅ NCB update cron scheduled (1st of month, 6:00 AM IST)')
}

// ── Start all jobs ────────────────────────────────────────
export function startAllCronJobs() {
  startRenewalReminderJob()
  startPolicyExpiryJob()
  startNCBUpdateJob()
  console.log('✅ All cron jobs started\n')
}
