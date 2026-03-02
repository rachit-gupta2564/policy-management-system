import React, { useState } from 'react'
import { Modal, FormGroup, Input, Select, BtnBrand, BtnGhost } from './ui'
import { useToast } from '../App'

const STEPS = ['Proposal', 'KYC', 'Payment', 'Policy']

function StepBar({ current }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-100 mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div
            key={label}
            className={`flex-1 flex items-center gap-2 px-4 py-3 text-sm
              ${active ? 'bg-brand-pale text-brand font-semibold' :
                done   ? 'text-brand font-medium' :
                         'text-gray-400'}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${active || done ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
              {done ? '✓' : n}
            </span>
            <span className="hidden sm:block">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Proposal ─────────────────────────────────────
function StepProposal() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Full Name"><Input placeholder="Arjun Mehta" /></FormGroup>
        <FormGroup label="Date of Birth"><Input type="date" defaultValue="1994-03-15" /></FormGroup>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Gender">
          <Select><option>Male</option><option>Female</option><option>Other</option></Select>
        </FormGroup>
        <FormGroup label="Phone"><Input type="tel" placeholder="9876543210" /></FormGroup>
      </div>
      <FormGroup label="Email"><Input type="email" placeholder="arjun@email.com" /></FormGroup>
      <FormGroup label="Address">
        <textarea
          placeholder="123, Brigade Road, Bengaluru — 560001"
          className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-h-[72px] resize-none"
        />
      </FormGroup>
    </>
  )
}

// ── Step 2 — KYC ─────────────────────────────────────────
function StepKYC({ toast }) {
  return (
    <>
      <p className="text-sm text-gray-400 mb-5">Upload identity documents. All files are AES-256 encrypted and stored securely.</p>
      {[
        { label: '🪪 Aadhaar Card',  note: 'Front & back scan required' },
        { label: '📋 PAN Card',      note: 'For income verification' },
        { label: '🏠 Address Proof', note: 'Utility bill, passport, or bank statement' },
      ].map(item => (
        <div
          key={item.label}
          onClick={() => toast(`${item.label} uploaded ✓`, 'success')}
          className="border-[1.5px] border-gray-200 rounded-xl px-5 py-3.5 flex items-center justify-between mb-3 cursor-pointer hover:border-brand hover:bg-brand-pale transition-colors"
        >
          <div>
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.note}</div>
          </div>
          <span className="text-brand text-sm font-semibold">Upload ↑</span>
        </div>
      ))}
    </>
  )
}

// ── Step 3 — Payment ──────────────────────────────────────
function StepPayment() {
  return (
    <>
      <div className="bg-surface border border-gray-100 rounded-xl p-5 mb-5 divide-y divide-gray-100">
        {[['Base Premium','₹18,400'],['GST (18%)','₹3,312']].map(([k,v]) => (
          <div key={k} className="flex justify-between py-2.5 text-sm">
            <span className="text-gray-400">{k}</span><span className="font-mono-dm">{v}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3.5 font-bold text-base">
          <span>Total Payable</span>
          <span className="font-mono-dm text-brand">₹21,712</span>
        </div>
      </div>
      <FormGroup label="Payment Method">
        <Select>
          <option>Credit / Debit Card</option>
          <option>Net Banking</option>
          <option>UPI</option>
          <option>EMI (0% interest)</option>
        </Select>
      </FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Card Number"><Input placeholder="4532 •••• •••• 8123" /></FormGroup>
        <FormGroup label="CVV"><Input placeholder="•••" maxLength="3" /></FormGroup>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Expiry"><Input placeholder="MM / YY" /></FormGroup>
        <FormGroup label="Name on Card"><Input placeholder="ARJUN MEHTA" /></FormGroup>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
        🔒 Transactions secured by 256-bit SSL encryption
      </div>
    </>
  )
}

// ── Step 4 — Success ──────────────────────────────────────
function StepSuccess() {
  return (
    <>
      <div className="text-center py-4 mb-5">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="font-display text-xl font-bold mb-1">Policy Issued Successfully!</h3>
        <p className="text-sm text-gray-400">Your certificate has been emailed to you.</p>
      </div>
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-brand px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-lg">🛡️</div>
          <div className="flex-1">
            <div className="font-display font-black text-white text-base">ShieldX</div>
            <div className="text-white/60 text-[10px] uppercase tracking-widest">Insurance Policy Certificate</div>
          </div>
          <div className="font-mono-dm text-white/60 text-xs">QR: 2026-00892</div>
        </div>
        <div className="p-5 divide-y divide-gray-50 text-sm">
          {[
            ['Policy Number', 'SHX-LI-2026-00892'],
            ['Policyholder',  'Arjun Mehta'],
            ['Sum Assured',   '₹50,00,000'],
            ['Premium Paid',  '₹21,712 ✓'],
            ['Issue Date',    '01 March 2026'],
            ['Valid Until',   '01 March 2046'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5">
              <span className="text-gray-400">{k}</span>
              <span className={`font-mono-dm font-medium ${k === 'Premium Paid' ? 'text-green-600' : 'text-gray-800'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Main Modal ────────────────────────────────────────────
export default function PurchaseModal({ onClose, productType = 'Life Insurance' }) {
  const toast   = useToast()
  const [step, setStep] = useState(1)
  const [paying, setPaying] = useState(false)

  const next = async () => {
    if (step === 3) {
      setPaying(true)
      toast('Processing payment...', 'info')
      await new Promise(r => setTimeout(r, 1500))
      setPaying(false)
      toast('Payment successful! Policy SHX-LI-2026-00892 issued ✓', 'success')
      setStep(4)
    } else if (step < 4) {
      setStep(s => s + 1)
    }
  }

  const footer = step === 4 ? (
    <>
      <BtnGhost onClick={onClose}>Close</BtnGhost>
      <BtnBrand onClick={() => { toast('Certificate downloaded as PDF ✓', 'success'); onClose() }}>
        ⬇ Download PDF
      </BtnBrand>
    </>
  ) : (
    <>
      {step > 1 && <BtnGhost onClick={() => setStep(s => s - 1)}>← Back</BtnGhost>}
      <BtnBrand onClick={next} className="ml-auto">
        {paying ? 'Processing…' : step === 3 ? '💳 Pay Now' : 'Continue →'}
      </BtnBrand>
    </>
  )

  return (
    <Modal title={`Purchase — ${productType}`} onClose={onClose} footer={footer} wide>
      <StepBar current={step} />
      {step === 1 && <StepProposal />}
      {step === 2 && <StepKYC toast={toast} />}
      {step === 3 && <StepPayment />}
      {step === 4 && <StepSuccess />}
    </Modal>
  )
}
