import React, { useState, useEffect } from 'react'
import { Modal, FormGroup, Input, Select, BtnBrand, BtnGhost } from './ui'
import { useToast } from '../App'
import { useAuth } from '../context/AuthContext'
import { productsAPI, policiesAPI } from '../services/api'

const STEPS = ['Plan', 'Details', 'Review', 'Done']

function StepBar({ current }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-100 mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={label}
            className={`flex-1 flex items-center gap-2 px-4 py-3 text-sm
              ${active ? 'bg-brand-pale text-brand font-semibold'
              : done   ? 'text-brand font-medium'
              :          'text-gray-400'}`}>
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

const TYPE_ICON = { life: '🌿', health: '❤️', vehicle: '🚗' }
const TYPE_LABEL = { life: 'Life', health: 'Health', vehicle: 'Vehicle' }

// ── Step 1: Choose Plan ───────────────────────────────────
function StepPlan({ products, selected, onSelect }) {
  if (!products.length) return (
    <div className="text-center py-8 text-gray-300">Loading products…</div>
  )
  return (
    <div className="space-y-3">
      {products.map(p => (
        <div key={p.id}
          onClick={() => onSelect(p)}
          className={`border-2 rounded-xl p-4 cursor-pointer transition-all
            ${selected?.id === p.id
              ? 'border-brand bg-brand-pale'
              : 'border-gray-200 hover:border-brand/50 hover:bg-surface'
            }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TYPE_ICON[p.type]}</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-brand">
                {+p.base_premium > 0 ? `₹${Number(p.base_premium).toLocaleString('en-IN')}/yr` : 'IDV-based'}
              </div>
              <div className="text-xs text-gray-400">base premium</div>
            </div>
          </div>
          {selected?.id === p.id && (
            <div className="mt-2 pt-2 border-t border-brand/20 grid grid-cols-3 gap-2">
              {(JSON.parse(p.coverage_details || '{}').features || []).slice(0, 3).map(f => (
                <div key={f} className="text-xs text-brand flex items-center gap-1">
                  <span className="text-green-500">✓</span> {f}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 2: Details form ──────────────────────────────────
function StepDetails({ product, form, setForm, user }) {
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <>
      <div className="bg-brand-pale border border-brand/20 rounded-xl px-4 py-3 mb-5 text-sm text-brand font-medium">
        {TYPE_ICON[product?.type]} {product?.name}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Full Name">
          <Input value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
        </FormGroup>
        <FormGroup label="Date of Birth">
          <Input type="date" value={form.dob} onChange={set('dob')} />
        </FormGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Gender">
          <Select value={form.gender} onChange={set('gender')}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </FormGroup>
        <FormGroup label="Phone">
          <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
        </FormGroup>
      </div>

      {product?.type === 'life' && (
        <FormGroup label="Sum Assured (₹)">
          <Select value={form.sum_assured} onChange={set('sum_assured')}>
            <option value="1000000">₹10 Lakhs</option>
            <option value="2500000">₹25 Lakhs</option>
            <option value="5000000">₹50 Lakhs</option>
            <option value="10000000">₹1 Crore</option>
            <option value="25000000">₹2.5 Crore</option>
            <option value="50000000">₹5 Crore</option>
          </Select>
        </FormGroup>
      )}

      {product?.type === 'health' && (
        <FormGroup label="Coverage Amount (₹)">
          <Select value={form.sum_assured} onChange={set('sum_assured')}>
            <option value="300000">₹3 Lakhs</option>
            <option value="500000">₹5 Lakhs</option>
            <option value="1000000">₹10 Lakhs</option>
            <option value="2000000">₹20 Lakhs</option>
            <option value="5000000">₹50 Lakhs</option>
          </Select>
        </FormGroup>
      )}

      {product?.type === 'vehicle' && (
        <>
          <FormGroup label="Vehicle Registration Number">
            <Input value={form.vehicle_reg} onChange={set('vehicle_reg')} placeholder="MH01AB1234" />
          </FormGroup>
          <FormGroup label="IDV (Insured Declared Value) ₹">
            <Input type="number" value={form.sum_assured} onChange={set('sum_assured')} placeholder="650000" />
          </FormGroup>
        </>
      )}

      <FormGroup label="Policy Term">
        <Select value={form.term_years} onChange={set('term_years')}>
          <option value="1">1 Year</option>
          {product?.type === 'life' && <option value="10">10 Years</option>}
          {product?.type === 'life' && <option value="20">20 Years</option>}
          {product?.type === 'life' && <option value="30">30 Years</option>}
        </Select>
      </FormGroup>
    </>
  )
}

// ── Step 3: Review + simulated payment ───────────────────
function StepReview({ product, form, premium, paying }) {
  const type = product?.type
  const sumDisplay = `₹${Number(form.sum_assured || 0).toLocaleString('en-IN')}`

  return (
    <>
      <div className="bg-surface border border-gray-100 rounded-xl p-5 mb-5 divide-y divide-gray-100">
        <div className="pb-3 mb-1">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Policy Summary</div>
          <div className="font-semibold">{product?.name}</div>
          <div className="text-sm text-gray-500">{TYPE_LABEL[type]} Insurance · {form.term_years} year{+form.term_years > 1 ? 's' : ''}</div>
        </div>
        {[
          ['Applicant',    form.full_name],
          ['Coverage',     sumDisplay],
          ['Base Premium', `₹${Number(product?.base_premium || 0).toLocaleString('en-IN')}/yr`],
          ['GST (18%)',    `₹${Math.round((premium || 0) * 0.18).toLocaleString('en-IN')}`],
        ].map(([k,v]) => (
          <div key={k} className="flex justify-between py-2.5 text-sm">
            <span className="text-gray-400">{k}</span>
            <span className="font-mono-dm">{v}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3.5 font-bold text-base">
          <span>Total Payable</span>
          <span className="font-mono-dm text-brand">₹{Math.round((premium || 0) * 1.18).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        ⚠ In demo mode, payment is simulated. Your policy will be created and sent for underwriter approval.
      </div>

      {paying && (
        <div className="mt-4 text-center text-sm text-brand font-medium animate-pulse">
          Processing payment…
        </div>
      )}
    </>
  )
}

// ── Step 4: Success ───────────────────────────────────────
function StepSuccess({ policyNumber, product, form }) {
  return (
    <div className="text-center py-4">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="font-display text-xl font-bold mb-1">Application Submitted!</h3>
      <div className="font-mono-dm text-brand text-lg font-bold mb-2">{policyNumber}</div>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
        Your policy application is now <strong>pending underwriter review</strong>. You'll be notified once it's approved.
      </p>
      <div className="bg-surface border border-gray-100 rounded-xl p-4 text-left text-sm">
        <div className="flex justify-between py-1.5 border-b border-gray-100">
          <span className="text-gray-400">Product</span>
          <span className="font-medium">{product?.name}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-gray-100">
          <span className="text-gray-400">Applicant</span>
          <span className="font-medium">{form.full_name}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-gray-400">Status</span>
          <span className="text-yellow-600 font-semibold">Pending Approval</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────
export default function PurchaseModal({ onClose }) {
  const toast       = useToast()
  const { user }    = useAuth()

  const [step,      setStep]      = useState(1)
  const [products,  setProducts]  = useState([])
  const [selected,  setSelected]  = useState(null)
  const [paying,    setPaying]    = useState(false)
  const [policyNum, setPolicyNum] = useState('')
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    full_name:   user?.full_name || '',
    dob:         '',
    gender:      '',
    phone:       user?.phone || '',
    sum_assured: '1000000',
    term_years:  '1',
    vehicle_reg: '',
  })

  useEffect(() => {
    productsAPI.list()
      .then(d => {
        const prods = d.products || []
        setProducts(prods)
        if (prods.length) setSelected(prods[0])
      })
      .catch(() => {})
  }, [])

  // Simple premium estimate
  const basePremium = selected ? (+selected.base_premium || 0) : 0
  const premium     = basePremium > 0
    ? Math.round(basePremium * +form.term_years)
    : Math.round((+form.sum_assured || 0) * 0.02) // 2% of IDV for vehicle

  const next = async () => {
    setError('')

    if (step === 1) {
      if (!selected) { toast('Please select a plan', 'info'); return }
      setStep(2)
    } else if (step === 2) {
      if (!form.full_name) { setError('Full name is required'); return }
      if (!form.dob)       { setError('Date of birth is required'); return }
      if (!form.sum_assured || +form.sum_assured <= 0) { setError('Please enter a valid coverage amount'); return }
      if (selected?.type === 'vehicle' && !form.vehicle_reg) { setError('Vehicle registration number is required'); return }
      setStep(3)
    } else if (step === 3) {
      // Simulate payment then create policy
      setPaying(true)
      await new Promise(r => setTimeout(r, 1200))
      try {
        const today    = new Date()
        const endDate  = new Date(today)
        endDate.setFullYear(endDate.getFullYear() + +form.term_years)

        // Call backend to create the policy (pending approval)
        const payload = {
          product_id:    selected.id,
          sum_assured:   +form.sum_assured,
          total_premium: premium,
          start_date:    today.toISOString().split('T')[0],
          end_date:      endDate.toISOString().split('T')[0],
          nominee_name:  '',
        }

        const data = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/policies/demo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('shieldx_token')}`,
          },
          body: JSON.stringify(payload),
        }).then(r => r.json())

        if (data.error) throw new Error(data.error)

        setPolicyNum(data.policy?.policy_number || 'SHX-NEW')
        setStep(4)
        toast(`Policy ${data.policy?.policy_number} created — pending approval!`, 'success')
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
      } finally {
        setPaying(false)
      }
    }
  }

  const footer = step === 4 ? (
    <BtnBrand onClick={() => onClose(true)}>View My Policies →</BtnBrand>
  ) : (
    <>
      {step > 1 && <BtnGhost onClick={() => { setStep(s => s - 1); setError('') }}>← Back</BtnGhost>}
      <BtnBrand onClick={next} className="ml-auto min-w-[130px]">
        {paying ? 'Processing…' : step === 3 ? '💳 Confirm & Pay' : 'Continue →'}
      </BtnBrand>
    </>
  )

  return (
    <Modal title={step === 4 ? 'Policy Created' : 'Purchase Insurance'} onClose={() => onClose(false)} footer={footer} wide>
      <StepBar current={step} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">⚠ {error}</div>
      )}

      {step === 1 && <StepPlan   products={products} selected={selected} onSelect={setSelected} />}
      {step === 2 && <StepDetails product={selected} form={form} setForm={setForm} user={user} />}
      {step === 3 && <StepReview  product={selected} form={form} premium={premium} paying={paying} />}
      {step === 4 && <StepSuccess policyNumber={policyNum} product={selected} form={form} />}
    </Modal>
  )
}
