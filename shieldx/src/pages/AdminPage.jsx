import React, { useState } from 'react'
import { Badge, Table, TR, TD, BtnSm } from '../components/ui'
import { useToast } from '../App'

const ADMIN_TABS = [
  { id: 'underwriter',    label: 'Underwriter'      },
  { id: 'claims',         label: 'Claims Adjuster'  },
  { id: 'analytics',      label: 'Analytics'        },
  { id: 'products',       label: 'Products'         },
]

// ── Stat card (dark) ──────────────────────────────────────
function DarkStat({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#140b2e] border border-[#2d1b4e] rounded-xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">{label}</div>
      <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

// ── Dark table wrapper ────────────────────────────────────
function DarkCard({ title, children }) {
  return (
    <div className="bg-[#140b2e] border border-[#2d1b4e] rounded-xl overflow-hidden mb-4">
      {title && (
        <div className="px-6 py-4 border-b border-[#2d1b4e]">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

// ── Underwriter Tab ───────────────────────────────────────
function UnderwriterTab({ toast }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DarkStat label="Pending Applications" value="14" />
        <DarkStat label="Approved Today"       value="8"  color="text-green-400" />
        <DarkStat label="Rejected"             value="2"  color="text-red-400" />
        <DarkStat label="Avg Processing Time"  value="2.3h" />
      </div>
      <DarkCard title="Pending Policy Applications">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a0a2e]">
                {['Applicant','Type','Sum','Age','KYC','Risk','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Priya Sharma',   type: '❤️ Health',  sum: '₹15L',     age: 42, kyc: 'Active',  risk: 'Low',    riskC: 'text-green-400' },
                { name: 'Rohan Desai',    type: '🚗 Vehicle', sum: 'IDV ₹8L',  age: 26, kyc: 'Active',  risk: 'Medium', riskC: 'text-orange-400' },
                { name: 'Siddharth Rao',  type: '🌿 Life',    sum: '₹1Cr',     age: 55, kyc: 'Pending', risk: 'High',   riskC: 'text-red-400' },
              ].map(row => (
                <tr key={row.name} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-sm text-white font-medium">{row.name}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.type}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.sum}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.age}</td>
                  <td className="px-5 py-4"><Badge status={row.kyc} /></td>
                  <td className={`px-5 py-4 text-sm font-bold ${row.riskC}`}>{row.risk}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <BtnSm onClick={() => toast(`Policy approved for ${row.name} ✓`, 'success')} variant="green">✓ Approve</BtnSm>
                      <BtnSm onClick={() => toast(`Application rejected.`, 'error')}               variant="red">✗ Reject</BtnSm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DarkCard>
    </>
  )
}

// ── Claims Adjuster Tab ───────────────────────────────────
function ClaimsTab({ toast }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DarkStat label="Open Claims"          value="7" />
        <DarkStat label="Approved This Month"  value="23" color="text-green-400" />
        <DarkStat label="Avg Settlement Time"  value="4.8d" />
        <DarkStat label="Total Disbursed"      value="₹18.4L" />
      </div>

      {/* State machine legend */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-white/40 text-xs">States:</span>
        {['Pending','Under Review','Active','Disbursed'].map((s, i) => (
          <React.Fragment key={s}>
            <Badge status={s === 'Active' ? 'Approved' : s} />
            {i < 3 && <span className="text-white/30">→</span>}
          </React.Fragment>
        ))}
        <span className="text-white/30">|</span>
        <Badge status="Rejected" />
      </div>

      <DarkCard title="Claims Queue — State Machine Workflow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a0a2e]">
                {['Claim ID','Policyholder','Type','Amount','Evidence','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id:'CLM-2026-00347', name:'Arjun Mehta',  type:'❤️ Health',  amt:'₹87,200', ev:'3 docs ✓',            status:'Under Review', evColor:'text-green-400',  action:'approve' },
                { id:'CLM-2026-00381', name:'Kavya Nair',   type:'🚗 Vehicle', amt:'₹42,000', ev:'1 doc (incomplete)',  status:'Pending',      evColor:'text-orange-400', action:'review'  },
                { id:'CLM-2025-04821', name:'Arjun Mehta',  type:'🚗 Vehicle', amt:'₹34,500', ev:'5 docs ✓',            status:'Approved',     evColor:'text-green-400',  action:'disburse'},
              ].map(row => (
                <tr key={row.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-xs font-mono-dm text-white/60">{row.id}</td>
                  <td className="px-5 py-4 text-sm text-white font-medium">{row.name}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.type}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.amt}</td>
                  <td className={`px-5 py-4 text-xs ${row.evColor}`}>{row.ev}</td>
                  <td className="px-5 py-4"><Badge status={row.status === 'Approved' ? 'Active' : row.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {row.action === 'approve'  && <><BtnSm onClick={() => toast(`Claim ${row.id} Approved → Disbursement initiated`,'success')} variant="green">✓ Approve</BtnSm><BtnSm onClick={() => toast('Claim rejected.','error')} variant="red">✗ Reject</BtnSm></>}
                      {row.action === 'review'   && <><BtnSm onClick={() => toast('Claim moved to Under Review. Adjuster assigned.','info')} variant="blue">→ Review</BtnSm><BtnSm onClick={() => toast('Claim rejected.','error')} variant="red">✗ Reject</BtnSm></>}
                      {row.action === 'disburse' && <BtnSm onClick={() => toast(`₹34,500 disbursed to bank account ✓`,'success')} variant="purple">💸 Disburse</BtnSm>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DarkCard>
    </>
  )
}

// ── Analytics Tab ─────────────────────────────────────────
const BAR_HEIGHTS = [45, 55, 60, 52, 70, 65, 80, 72, 90, 85, 95, 100]
const BAR_MONTHS  = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb']

function AnalyticsTab() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DarkStat label="Total Policies"      value="2,841" color="text-violet-400" />
        <DarkStat label="Premiums Collected"  value="₹4.2Cr" color="text-green-400" />
        <DarkStat label="Claim Ratio"         value="38.4%" />
        <DarkStat label="Loss Ratio"          value="42.1%" color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <DarkCard title="Monthly Premium Collection (₹ Lakhs)">
          <div className="px-5 pb-5">
            <div className="flex items-end gap-1.5 h-24 mt-4">
              {BAR_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm transition-opacity hover:opacity-100 ${i === 11 ? 'bg-gradient-to-t from-accent to-amber-400 opacity-100' : 'bg-gradient-to-t from-brand to-brand-light opacity-75'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {BAR_MONTHS.map(m => (
                <div key={m} className="flex-1 text-center text-[9px] text-white/25">{m}</div>
              ))}
            </div>
          </div>
        </DarkCard>

        {/* Breakdown + Audit */}
        <DarkCard>
          <div className="p-5">
            <div className="text-white font-semibold mb-4 text-sm">Policy Distribution by Type</div>
            {[
              { label: '🌿 Life Insurance',    pct: 43, color: 'from-brand-light to-brand' },
              { label: '❤️ Health Insurance',  pct: 35, color: 'from-blue-500 to-blue-700' },
              { label: '🚗 Vehicle Insurance', pct: 22, color: 'from-amber-400 to-amber-600' },
            ].map(b => (
              <div key={b.label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-white/70 text-sm">{b.label}</span>
                  <span className="text-white font-semibold text-sm">{b.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${b.color} rounded-full`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}

            <div className="mt-5 pt-4 border-t border-[#2d1b4e]">
              <div className="text-white font-semibold text-sm mb-3">Audit Log (Recent)</div>
              {[
                '[2026-03-01 14:23] Policy SHX-LI-2026-00891 created',
                '[2026-03-01 14:18] Claim CLM-2026-00347 status → Under Review',
                '[2026-03-01 13:55] Payment received — SHX-VI-2026-00124',
                '[2026-03-01 13:40] KYC verified — Priya Sharma',
                '[2026-03-01 12:30] Policy SHX-HI-2026-00410 approved',
              ].map(line => (
                <div key={line} className="font-mono-dm text-[11px] text-white/35 leading-7">{line}</div>
              ))}
            </div>
          </div>
        </DarkCard>
      </div>
    </>
  )
}

// ── Products Tab ──────────────────────────────────────────
function ProductsTab({ toast }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-bold text-white">Insurance Products</h3>
        <button onClick={() => toast('New product form — coming soon','info')}
          className="bg-accent hover:bg-accent-dark text-brand-dark text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + New Product
        </button>
      </div>
      <DarkCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a0a2e]">
                {['Product Name','Type','Base Premium','Min Age','Max Age','Max Coverage','Status','Edit'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name:'ShieldX Term Plan',   type:'🌿 Life',   base:'₹850/mo',  min:18, max:65, cov:'₹5 Cr',      status:'Active'       },
                { name:'ShieldX Health Plus', type:'❤️ Health', base:'₹650/mo',  min:0,  max:70, cov:'₹1 Cr',      status:'Active'       },
                { name:'ShieldX Motor Comp',  type:'🚗 Vehicle',base:'2% of IDV',min:18, max:'—',cov:'IDV based',  status:'Active'       },
                { name:'ShieldX Senior Care', type:'❤️ Health', base:'₹2,100/mo',min:60, max:80, cov:'₹25 Lakhs',  status:'Pending'      },
              ].map(row => (
                <tr key={row.name} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-sm text-white font-semibold">{row.name}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.type}</td>
                  <td className="px-5 py-4 text-sm text-white/70 font-mono-dm">{row.base}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.min}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.max}</td>
                  <td className="px-5 py-4 text-sm text-white/70">{row.cov}</td>
                  <td className="px-5 py-4"><Badge status={row.status} /></td>
                  <td className="px-5 py-4"><BtnSm variant="blue" onClick={() => {}}>Edit</BtnSm></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DarkCard>
    </>
  )
}

// ── Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const toast = useToast()
  const [tab, setTab] = useState('underwriter')

  return (
    <div className="bg-[#0d0720] min-h-[calc(100vh-64px)]">
      {/* Sub-topbar */}
      <div className="bg-[#1a0a2e] px-6 h-12 flex items-center gap-1 border-b border-[#2d1b4e]">
        <span className="text-white/35 text-xs mr-2">ShieldX Admin</span>
        {ADMIN_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
          <span className="text-white/40 text-xs">Admin — Raj Singh</span>
        </div>
      </div>

      <div className="p-6">
        {tab === 'underwriter' && <UnderwriterTab toast={toast} />}
        {tab === 'claims'      && <ClaimsTab      toast={toast} />}
        {tab === 'analytics'   && <AnalyticsTab />}
        {tab === 'products'    && <ProductsTab    toast={toast} />}
      </div>
    </div>
  )
}
