import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export async function generatePolicyCertificate(policy, user) {
  return new Promise(async (resolve, reject) => {
    try {
      const certDir  = path.join(process.env.UPLOAD_DIR || './uploads', 'certificates')
      if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true })

      const fileName = `${policy.policy_number.replace(/-/g,'_')}_certificate.pdf`
      const filePath = path.join(certDir, fileName)

      // QR code encodes key policy info for verification
      const qrBuffer = Buffer.from(
        (await QRCode.toDataURL(
          `SHIELDX|${policy.policy_number}|${user.email}|${policy.status.toUpperCase()}`,
          { width: 80 }
        )).split(',')[1],
        'base64'
      )

      const doc    = new PDFDocument({ size: 'A4', margin: 0 })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const W = 595.28

      // ── Header ────────────────────────────────────────────
      doc.rect(0, 0, W, 95).fill('#0f4c35')
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26)
         .text('ShieldX', 48, 30)
      doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.55)')
         .text('INSURANCE POLICY CERTIFICATE', 48, 60)
      doc.image(qrBuffer, W - 105, 12, { width: 70 })
      doc.fontSize(7).fillColor('rgba(255,255,255,0.4)')
         .text('Scan to verify', W - 105, 85, { width: 70, align: 'center' })

      // ── Status pill ───────────────────────────────────────
      const statusColor = policy.status === 'active' ? '#16a34a' : '#d97706'
      doc.roundedRect(48, 112, 72, 18, 9).fill(statusColor)
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8)
         .text(policy.status.toUpperCase(), 48, 118, { width: 72, align: 'center' })

      // ── Policy fields ─────────────────────────────────────
      const fields = [
        ['Policy Number',   policy.policy_number],
        ['Policyholder',    user.full_name],
        ['Email',           user.email],
        ['Phone',           user.phone || '—'],
        ['Insurance Type',  `${policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance`],
        ['Sum Assured',     `₹${Number(policy.sum_assured).toLocaleString('en-IN')}`],
        ['Annual Premium',  `₹${Number(policy.annual_premium).toLocaleString('en-IN')}`],
        ['GST (18%)',       `₹${Number(policy.gst_amount).toLocaleString('en-IN')}`],
        ['Total Paid',      `₹${Number(policy.total_premium).toLocaleString('en-IN')}`],
        ['Start Date',      new Date(policy.start_date).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })],
        ['End Date',        new Date(policy.end_date).toLocaleDateString('en-IN',   { day:'2-digit', month:'long', year:'numeric' })],
        ['NCB Discount',    `${policy.ncb_percent || 0}%`],
        ...(policy.nominee_name ? [['Nominee', `${policy.nominee_name} (${policy.nominee_relation || ''})`]] : []),
      ]

      let y = 145
      fields.forEach(([label, value], i) => {
        doc.rect(48, y, W - 96, 26).fill(i % 2 === 0 ? '#f7f9f8' : '#ffffff')
        doc.fillColor('#6b7280').font('Helvetica').fontSize(9)
           .text(label, 60, y + 8, { width: 160 })
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9)
           .text(String(value), 230, y + 8, { width: W - 290 })
        y += 26
      })

      // ── Divider + legal footer ────────────────────────────
      y += 12
      doc.moveTo(48, y).lineTo(W - 48, y).stroke('#e5e7eb')
      doc.rect(0, 750, W, 92).fill('#f7f9f8')
      doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5)
         .text(
           'This certificate is digitally generated and is legally valid as proof of insurance. ' +
           'Issued by ShieldX Insurance Ltd., IRDAI Registration No. 147. ' +
           'For claims: 1800-123-4567 | support@shieldx.in | www.shieldx.in',
           48, 770, { width: W - 96, align: 'center' }
         )

      doc.end()
      stream.on('finish', () => resolve(filePath))
      stream.on('error',  reject)
    } catch (err) {
      reject(err)
    }
  })
}
