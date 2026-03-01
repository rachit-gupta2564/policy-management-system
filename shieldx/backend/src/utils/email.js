import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const FROM = process.env.EMAIL_FROM || 'ShieldX Insurance <no-reply@shieldx.in>'

// ── Shared HTML wrapper ───────────────────────────────────
function html(body) {
  return `
    <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#0f4c35;padding:28px 32px;display:flex;align-items:center">
        <span style="font-size:22px;font-weight:900;color:#fff;font-family:serif">
          Shield<span style="color:#e8a020">X</span>
        </span>
        <span style="color:rgba(255,255,255,0.5);font-size:11px;margin-left:12px;letter-spacing:2px">INSURANCE</span>
      </div>
      <div style="padding:32px">${body}</div>
      <div style="padding:16px 32px;background:#f7f9f8;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb">
        ShieldX Insurance Ltd. | IRDAI Reg. No. 147 | support@shieldx.in | 1800-123-4567
      </div>
    </div>`
}

// ── Welcome email ─────────────────────────────────────────
export async function sendWelcomeEmail(user) {
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: 'Welcome to ShieldX Insurance! 🛡️',
    html: html(`
      <h2 style="color:#111;font-family:serif">Welcome, ${user.full_name}! 👋</h2>
      <p style="color:#4b5563">Your ShieldX account has been created. Browse our products, get instant premium estimates, and purchase policies entirely online.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard"
         style="display:inline-block;background:#0f4c35;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
        Go to Dashboard →
      </a>
    `),
  })
}

// ── Email verification ────────────────────────────────────
export async function sendVerificationEmail(user, token) {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: 'Verify your ShieldX email address',
    html: html(`
      <h2 style="font-family:serif">Verify your email</h2>
      <p style="color:#4b5563">Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${link}" style="display:inline-block;background:#0f4c35;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
        Verify Email →
      </a>
      <p style="color:#9ca3af;font-size:12px;margin-top:16px">Or copy this link: ${link}</p>
    `),
  })
}

// ── Password reset ────────────────────────────────────────
export async function sendPasswordResetEmail(user, token) {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: 'Reset your ShieldX password',
    html: html(`
      <h2 style="font-family:serif">Password Reset Request</h2>
      <p style="color:#4b5563">We received a request to reset your password. Click the button below. This link expires in <strong>${process.env.RESET_TOKEN_EXPIRES_MINUTES || 30} minutes</strong>.</p>
      <a href="${link}" style="display:inline-block;background:#c0392b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
        Reset Password →
      </a>
      <p style="color:#9ca3af;font-size:12px;margin-top:16px">If you did not request this, ignore this email. Your password will not change.</p>
    `),
  })
}

// ── Policy issued ─────────────────────────────────────────
export async function sendPolicyIssuedEmail(user, policy, pdfPath) {
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: `Policy Issued — ${policy.policy_number} ✅`,
    html: html(`
      <h2 style="font-family:serif">🎉 Your policy is active!</h2>
      <p style="color:#4b5563">Dear ${user.full_name}, your <strong>${policy.type} insurance policy</strong> has been issued. Your certificate is attached.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
        ${[
          ['Policy Number', policy.policy_number],
          ['Sum Assured',   `₹${Number(policy.sum_assured).toLocaleString('en-IN')}`],
          ['Annual Premium',`₹${Number(policy.total_premium).toLocaleString('en-IN')}`],
          ['Valid Until',   new Date(policy.end_date).toLocaleDateString('en-IN')],
        ].map(([k,v], i) => `
          <tr style="background:${i%2===0?'#f7f9f8':'#fff'}">
            <td style="padding:10px;color:#6b7280">${k}</td>
            <td style="padding:10px;font-weight:600;font-family:monospace">${v}</td>
          </tr>`).join('')}
      </table>
    `),
    attachments: pdfPath ? [{ filename: `${policy.policy_number}_certificate.pdf`, path: pdfPath }] : [],
  })
}

// ── Policy rejected ───────────────────────────────────────
export async function sendPolicyRejectedEmail(user, policy) {
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: `Policy Application Update — ${policy.policy_number}`,
    html: html(`
      <h2 style="font-family:serif">Policy Application — Additional Review Required</h2>
      <p style="color:#4b5563">Dear ${user.full_name}, after our underwriting review, we are unable to approve your application at this time.</p>
      ${policy.rejection_reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin-top:16px"><strong>Reason:</strong> ${policy.rejection_reason}</div>` : ''}
      <p style="color:#4b5563;margin-top:16px">You may re-apply with updated information or contact our support team for assistance.</p>
    `),
  })
}

// ── Renewal reminder ──────────────────────────────────────
export async function sendRenewalReminderEmail(user, policy, daysLeft) {
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: `⚠️ Renewal Reminder: ${daysLeft} days left — ${policy.policy_number}`,
    html: html(`
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px">
        <h3 style="margin:0;color:#92400e">⚠️ Your policy expires in ${daysLeft} days</h3>
      </div>
      <p style="color:#4b5563">Dear ${user.full_name}, your <strong>${policy.policy_number}</strong> expires on <strong>${new Date(policy.end_date).toLocaleDateString('en-IN')}</strong>.</p>
      <p style="color:#4b5563">Renewing on time preserves your No-Claim Bonus and ensures uninterrupted coverage.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard?renew=${policy.id}"
         style="display:inline-block;background:#e8a020;color:#071a12;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px">
        Renew Now →
      </a>
    `),
  })
}

// ── Claim status update ───────────────────────────────────
export async function sendClaimStatusEmail(user, claim, newStatus) {
  const cfg = {
    under_review: { emoji:'🔍', title:'Claim Under Review',   color:'#1d4ed8', msg:`Our adjuster is reviewing your claim #${claim.claim_number}. You will hear from us within 2–3 business days.` },
    approved:     { emoji:'✅', title:'Claim Approved!',       color:'#15803d', msg:`Your claim of <strong>₹${Number(claim.claim_amount).toLocaleString('en-IN')}</strong> has been approved. Disbursement is being processed.` },
    rejected:     { emoji:'❌', title:'Claim Not Approved',    color:'#b91c1c', msg:`We could not approve your claim. ${claim.resolution_note ? `Reason: ${claim.resolution_note}` : 'Please contact support for details.'}` },
    disbursed:    { emoji:'💸', title:'Amount Disbursed!',     color:'#7e22ce', msg:`<strong>₹${Number(claim.approved_amount || claim.claim_amount).toLocaleString('en-IN')}</strong> has been credited to your registered bank account.` },
  }[newStatus] || { emoji:'ℹ️', title:'Claim Update', color:'#374151', msg:`Status updated to: ${newStatus}` }

  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: `${cfg.emoji} ${cfg.title} — ${claim.claim_number}`,
    html: html(`
      <h2 style="font-family:serif;color:${cfg.color}">${cfg.emoji} ${cfg.title}</h2>
      <p style="color:#4b5563">Dear ${user.full_name},</p>
      <p style="color:#4b5563">${cfg.msg}</p>
      <p style="color:#9ca3af;font-size:13px;margin-top:16px">Claim Reference: <strong style="color:#111">${claim.claim_number}</strong></p>
      <a href="${process.env.FRONTEND_URL}/dashboard"
         style="display:inline-block;background:#0f4c35;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
        View in Dashboard →
      </a>
    `),
  })
}

// ── NCB updated ───────────────────────────────────────────
export async function sendNCBUpdateEmail(user, policy, oldNCB, newNCB, reason) {
  const increased = newNCB > oldNCB
  await transporter.sendMail({
    from: FROM, to: user.email,
    subject: `No-Claim Bonus ${increased ? 'Increased' : 'Updated'} — ${policy.policy_number}`,
    html: html(`
      <h2 style="font-family:serif">${increased ? '🎉 NCB Increased!' : '📋 NCB Update'}</h2>
      <p style="color:#4b5563">Dear ${user.full_name}, your No-Claim Bonus on policy <strong>${policy.policy_number}</strong> has been updated.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
        <tr style="background:#f7f9f8"><td style="padding:10px;color:#6b7280">Previous NCB</td><td style="padding:10px;font-weight:600">${oldNCB}%</td></tr>
        <tr><td style="padding:10px;color:#6b7280">New NCB</td><td style="padding:10px;font-weight:600;color:${increased?'#15803d':'#b91c1c'}">${newNCB}%</td></tr>
        <tr style="background:#f7f9f8"><td style="padding:10px;color:#6b7280">Reason</td><td style="padding:10px">${reason}</td></tr>
      </table>
      ${increased ? `<p style="color:#15803d;margin-top:16px">✅ Your premium will be reduced by <strong>${newNCB}%</strong> on next renewal.</p>` : ''}
    `),
  })
}
