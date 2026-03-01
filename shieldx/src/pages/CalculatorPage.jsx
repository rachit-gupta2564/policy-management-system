import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader, FormGroup, Input, Select } from '../components/ui'
import { calcVehicle, calcHealth, calcLife, fmt } from '../utils/premium'
import PurchaseModal from '../components/PurchaseModal'

// ── Vehicle form state ────────────────────────────────────
function useVehicle() {
  const [s, setS] = useState({
    idv: 600000, makeFactor: 1, yearFactor: 1, coverageFactor: 1.5, ncbRate: 0,
    addons: { zeroDepre: false, roadside: false, engine: false, rti: false }
  })
  const set = k => v => setS(p => ({ ...p, [k]: v }))
  const toggleAddon = k => setS(p => ({ ...p, addons: { ...p.addons, [k]: !p.addons[k] } }))
  const result = calcVehicle(s)
  const formula = `Base = IDV(${s.idv.toLocaleString('en-IN')}) × 2% × Make(${s.makeFactor}) × Year(${s.yearFactor}) × Coverage(${s.coverageFactor})\nNCB(${s.ncbRate * 100}%) + Add-ons + GST(18%)`
  return { s, set, toggleAddon, result, formula }
}

function useHealth() {
  const [s, setS] = useState({ age: 32, sumLakhs: 10, planFactor: 1, pecFactor: 1 })
  const set = k => v => setS(p => ({ ...p, [k]: v }))
  const result = calcHealth(s)
  const formula = `Base = Sum(₹${s.sumLakhs}L) × 500 × AgeFactor(${result.ageFactor?.toFixed(2)}) × Plan(${s.planFactor}) × PEC(${s.pecFactor})\nAdd GST(18%)`
  return { s, set, result, formula }
}

function useLife() {
  const [s, setS] = useState({ age: 28, termYears: 20, sumLakhs: 50, smokerFactor: 1 })
  const set = k => v => setS(p => ({ ...p, [k]: v }))
  const result = calcLife(s)
  const formula = `Base = Sum(₹${s.sumLakhs}L) × 120 × AgeFactor(${result.ageFactor?.toFixed(2)}) × Term(${result.termFactor}) × Smoker(${s.smokerFactor})\nAdd GST(18%)`
  return { s, set, result, formula }
}

// ── Breakdown row ─────────────────────────────────────────
function BreakRow({ label, value, highlight = false, negative = false }) {
  return (
    <div className={`flex justify-between items-center py-2.5 ${highlight ? 'border-t border-white/15 mt-1 pt-3.5' : ''}`}>
      <span className={`text-sm ${highlight ? 'text-white font-bold text-base' : 'text-white/60'}`}>{label}</span>
      <span className={`font-mono-dm text-sm ${negative ? 'text-green-400' : highlight ? 'text-accent font-bold text-lg' : 'text-white'}`}>
        {negative && value !== '₹0' ? '-' : ''}{value}
      </span>
    </div>
  )
}

export default function CalculatorPage() {
  const navigate = useNavigate()
  const [type,        setType]        = useState('vehicle')
  const [showPurchase, setShowPurchase] = useState(false)

  const vehicle = useVehicle()
  const health  = useHealth()
  const life    = useLife()

  const current = type === 'vehicle' ? vehicle : type === 'health' ? health : life
  const { result, formula } = current

  const typeLabel = type === 'vehicle' ? 'Vehicle Insurance' : type === 'health' ? 'Health Insurance' : 'Life Insurance'

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-sm text-gray-400 mb-5">
          Products / <span className="text-gray-900 font-medium">Premium Calculator</span>
        </div>
        <SectionHeader
          eyebrow="Instant Estimate"
          title="Premium Calculator"
          sub="Enter your details for an accurate estimate. Final premium is confirmed after underwriter review."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Form card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-card">
            <FormGroup label="Insurance Type">
              <Select value={type} onChange={e => setType(e.target.value)}>
                <option value="vehicle">Vehicle Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="life">Life Insurance</option>
              </Select>
            </FormGroup>

            {/* ── Vehicle ── */}
            {type === 'vehicle' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Vehicle Make">
                    <Select onChange={e => vehicle.set('makeFactor')(parseFloat(e.target.value))}>
                      <option value="1">Maruti Suzuki</option>
                      <option value="1.1">Hyundai</option>
                      <option value="1.2">Tata Motors</option>
                      <option value="1.3">Honda</option>
                      <option value="1.5">BMW</option>
                      <option value="1.8">Mercedes</option>
                    </Select>
                  </FormGroup>
                  <FormGroup label="Manufacture Year">
                    <Select onChange={e => vehicle.set('yearFactor')(parseFloat(e.target.value))}>
                      <option value="0.9">2024</option>
                      <option value="1">2023</option>
                      <option value="1.1">2022</option>
                      <option value="1.2">2021</option>
                      <option value="1.35">2020</option>
                      <option value="1.5">2019 or older</option>
                    </Select>
                  </FormGroup>
                </div>
                <FormGroup label="Insured Declared Value (IDV) — ₹">
                  <Input type="number" value={vehicle.s.idv}
                    onChange={e => vehicle.set('idv')(parseFloat(e.target.value) || 0)} />
                </FormGroup>
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Coverage Type">
                    <Select onChange={e => vehicle.set('coverageFactor')(parseFloat(e.target.value))}>
                      <option value="1.5">Comprehensive</option>
                      <option value="1">Third Party Only</option>
                    </Select>
                  </FormGroup>
                  <FormGroup label="NCB Discount">
                    <Select onChange={e => vehicle.set('ncbRate')(parseFloat(e.target.value))}>
                      <option value="0">No NCB (New)</option>
                      <option value="0.2">20% — 1 year</option>
                      <option value="0.25">25% — 2 years</option>
                      <option value="0.35">35% — 3 years</option>
                      <option value="0.45">45% — 4 years</option>
                      <option value="0.5">50% — 5+ years</option>
                    </Select>
                  </FormGroup>
                </div>
                <FormGroup label="Add-ons">
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[['zeroDepre','Zero Depreciation'],['roadside','Roadside Assist'],['engine','Engine Protection'],['rti','Return to Invoice']].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={vehicle.s.addons[k]}
                          onChange={() => vehicle.toggleAddon(k)}
                          className="accent-brand w-4 h-4 rounded" />
                        {label}
                      </label>
                    ))}
                  </div>
                </FormGroup>
              </>
            )}

            {/* ── Health ── */}
            {type === 'health' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Age (Primary)">
                    <Input type="number" value={health.s.age} min="18" max="70"
                      onChange={e => health.set('age')(parseInt(e.target.value) || 18)} />
                  </FormGroup>
                  <FormGroup label="Sum Insured (₹ Lakhs)">
                    <Select onChange={e => health.set('sumLakhs')(parseInt(e.target.value))}>
                      <option value="5">5 Lakhs</option>
                      <option value="10">10 Lakhs</option>
                      <option value="15">15 Lakhs</option>
                      <option value="25">25 Lakhs</option>
                      <option value="50">50 Lakhs</option>
                    </Select>
                  </FormGroup>
                </div>
                <FormGroup label="Plan Type">
                  <Select onChange={e => health.set('planFactor')(parseFloat(e.target.value))}>
                    <option value="1">Individual</option>
                    <option value="1.4">Family Floater (2 adults)</option>
                    <option value="1.6">Family Floater (2 adults + 2 kids)</option>
                  </Select>
                </FormGroup>
                <FormGroup label="Pre-existing Conditions">
                  <Select onChange={e => health.set('pecFactor')(parseFloat(e.target.value))}>
                    <option value="1">None</option>
                    <option value="1.15">Diabetes</option>
                    <option value="1.2">Hypertension</option>
                    <option value="1.3">Both / Others</option>
                  </Select>
                </FormGroup>
              </>
            )}

            {/* ── Life ── */}
            {type === 'life' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Age">
                    <Input type="number" value={life.s.age} min="18" max="65"
                      onChange={e => life.set('age')(parseInt(e.target.value) || 18)} />
                  </FormGroup>
                  <FormGroup label="Policy Term (Years)">
                    <Select onChange={e => life.set('termYears')(parseInt(e.target.value))}>
                      <option value="10">10 Years</option>
                      <option value="15">15 Years</option>
                      <option value="20">20 Years</option>
                      <option value="30">30 Years</option>
                    </Select>
                  </FormGroup>
                </div>
                <FormGroup label="Sum Assured (₹ Lakhs)">
                  <Select onChange={e => life.set('sumLakhs')(parseInt(e.target.value))}>
                    <option value="25">25 Lakhs</option>
                    <option value="50">50 Lakhs</option>
                    <option value="100">1 Crore</option>
                    <option value="200">2 Crore</option>
                  </Select>
                </FormGroup>
                <FormGroup label="Smoker / Tobacco User">
                  <Select onChange={e => life.set('smokerFactor')(parseFloat(e.target.value))}>
                    <option value="1">No</option>
                    <option value="1.45">Yes</option>
                  </Select>
                </FormGroup>
              </>
            )}

            <button
              onClick={() => setShowPurchase(true)}
              className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-3.5 rounded-xl mt-2 transition-colors duration-150"
            >
              Proceed to Purchase →
            </button>
          </div>

          {/* Result panel */}
          <div className="bg-brand rounded-2xl p-7 sticky top-20 text-white">
            <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Estimated Annual Premium</div>
            <div className="font-display text-5xl font-black text-accent leading-none mb-1">
              {fmt(result.total)}
            </div>
            <div className="text-white/50 text-sm mb-7">
              ≈ {fmt(result.total / 12)}/month
            </div>

            <div className="bg-white/[0.07] rounded-xl p-4 mb-5">
              <BreakRow label="Base Premium" value={fmt(result.base)} />
              <BreakRow label="GST (18%)"    value={fmt(result.gst)}  />
              <BreakRow label="Add-ons"       value={fmt(result.addons)} />
              {result.ncb > 0 && <BreakRow label="NCB Discount" value={fmt(result.ncb)} negative />}
              <BreakRow label="Total" value={fmt(result.total)} highlight />
            </div>

            <div className="bg-white/[0.07] rounded-xl p-4 text-xs text-white/55 leading-relaxed">
              <div className="font-semibold text-white mb-1.5">Formula used:</div>
              <pre className="font-mono-dm whitespace-pre-wrap">{formula}</pre>
            </div>

            <div className="mt-5 text-xs text-white/35 leading-relaxed">
              Estimate only. Final premium confirmed after underwriter risk assessment and KYC verification.
            </div>
          </div>
        </div>
      </div>

      {showPurchase && (
        <PurchaseModal onClose={() => setShowPurchase(false)} productType={typeLabel} />
      )}
    </>
  )
}
