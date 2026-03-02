import React, { useState } from 'react'
import { POLICIES, CLAIMS } from '../data/mockData'
import { Badge, Card, StatCard, Table, TR, TD, BtnSm, UploadZone } from '../components/ui'
import PolicyCertModal from '../components/PolicyCertModal'
import ClaimModal from '../components/ClaimModal'
import ClaimTimelineModal from '../components/ClaimTimelineModal'
import PurchaseModal from '../components/PurchaseModal'
import { useToast } from '../App'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'overview',   icon: '🏠', label: 'Overview'    },
  { id: 'policies',   icon: '📄', label: 'My Policies' },
  { id: 'claims',     icon: '📋', label: 'Claims'      },
  { id: 'documents',  icon: '📁', label: 'Documents'   },
  { id: 'kyc',        icon: '🪪', label: 'KYC Status'  },
  { id: 'renewals',   icon: '🔄', label: 'Renewals'    },
]

// ── Renewal Banner ────────────────────────────────────────
function RenewalBanner({ onRenew }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-xl px-5 py-4 flex items-center justify-between mb-6">
      <div>
        <div className="text-sm font-semibold text-amber-900">
          ⚠ Renewal Due: Your Vehicle Insurance <span className="font-mono-dm">SHX-VI-2024-00123</span> expires in <strong>28 days</strong>
        </div>
        <div className="text-xs text-amber-700 mt-0.5">Auto-reminder sent to your email on March 1, 2026</div>
      </div>
      <button
        onClick={onRenew}
        className="shrink-0 ml-4 bg-accent hover:bg-accent-dark text-brand-dark text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-glow"
      >
        Renew Now
      </button>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────
function OverviewTab({ onCert, onClaim, onTimeline, onNewPolicy }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Policies"     value="3"         change="↑ 1 added this year" changeType="up" />
        <StatCard label="Annual Premium"      value="₹42,850"   change="Tax saving: ₹12,855" changeType="up" />
        <StatCard label="Claims Filed"        value="2"         change="1 approved, 1 pending" />
        <StatCard label="Next Renewal"        value="Mar 29"    change="⚠ 28 days remaining" changeType="down" />
      </div>

      <Card className="mb-5">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Active Policies</h3>
          <button onClick={onNewPolicy}
            className="bg-brand hover:bg-brand-light text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Policy
          </button>
        </div>
        <Table headers={['Policy Number','Type','Coverage','Premium','Status','Expiry','Actions']}>
          {POLICIES.map(p => (
            <TR key={p.id}>
              <TD><span className="font-mono-dm text-xs">{p.id}</span></TD>
              <TD>{p.icon} {p.type}</TD>
              <TD>{p.coverage}</TD>
              <TD>{p.premium}</TD>
              <TD><Badge status={p.status} /></TD>
              <TD>{p.expiry}</TD>
              <TD>
                {p.status === 'Active'
                  ? <BtnSm onClick={() => onCert(p)} variant="blue">📄 Certificate</BtnSm>
                  : <BtnSm onClick={() => onNewPolicy()} variant="green">🔄 Renew</BtnSm>
                }
              </TD>
            </TR>
          ))}
        </Table>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Recent Claims</h3>
          <BtnSm onClick={onClaim} variant="blue">+ File Claim</BtnSm>
        </div>
        <Table headers={['Claim ID','Policy','Incident','Amount','Status','Filed']}>
          {CLAIMS.map(c => (
            <TR key={c.id}>
              <TD><span className="font-mono-dm text-xs">{c.id}</span></TD>
              <TD>{c.icon} {c.type}</TD>
              <TD>{c.description}</TD>
              <TD>{c.amount}</TD>
              <TD><Badge status={c.status} /></TD>
              <TD>{c.filed}</TD>
            </TR>
          ))}
        </Table>
      </Card>
    </>
  )
}

// ── Policies Tab ──────────────────────────────────────────
function PoliciesTab({ onCert }) {
  return (
    <Card>
      <Table headers={['Policy Number','Type','Coverage','Premium','Status','Expiry','Actions']}>
        {POLICIES.map(p => (
          <TR key={p.id}>
            <TD><span className="font-mono-dm text-xs">{p.id}</span></TD>
            <TD>{p.icon} {p.type} Insurance</TD>
            <TD>{p.coverage}</TD>
            <TD>{p.premium}</TD>
            <TD><Badge status={p.status} /></TD>
            <TD>{p.expiry}</TD>
            <TD>
              {p.status === 'Active'
                ? <BtnSm onClick={() => onCert(p)} variant="blue">📄 Download</BtnSm>
                : <BtnSm variant="green">🔄 Renew</BtnSm>}
            </TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ── Claims Tab ────────────────────────────────────────────
function ClaimsTab({ onNewClaim, onTimeline }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-2xl font-bold">Claims History</h3>
        <button onClick={onNewClaim}
          className="bg-brand hover:bg-brand-light text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          + File New Claim
        </button>
      </div>
      <Card>
        <Table headers={['Claim ID','Policy','Description','Amount','Status','Filed','Timeline']}>
          {CLAIMS.map(c => (
            <TR key={c.id}>
              <TD><span className="font-mono-dm text-xs">{c.id}</span></TD>
              <TD>{c.icon} {c.type}</TD>
              <TD className="max-w-[180px] truncate">{c.description}</TD>
              <TD>{c.amount}</TD>
              <TD><Badge status={c.status} /></TD>
              <TD>{c.filed}</TD>
              <TD><BtnSm onClick={() => onTimeline(c)} variant="blue">View</BtnSm></TD>
            </TR>
          ))}
        </Table>
      </Card>
    </>
  )
}

// ── KYC Tab ───────────────────────────────────────────────
function KYCTab({ toast }) {
  const docs = [
    { label: '🪪 Aadhaar Card',  note: '✓ Uploaded & Verified on Jan 5, 2024',    done: true  },
    { label: '📋 PAN Card',      note: '✓ Uploaded & Verified on Jan 5, 2024',    done: true  },
    { label: '🚗 Driving License', note: 'Not uploaded — required for Vehicle Insurance', done: false },
  ]
  return (
    <>
      <h3 className="font-display text-2xl font-bold mb-1">KYC Verification</h3>
      <p className="text-sm text-gray-400 mb-6">All documents are AES-256 encrypted. Required for policy issuance.</p>
      {docs.map(d => (
        <div
          key={d.label}
          onClick={() => toast(d.done ? `${d.label} — Already verified ✓` : 'Upload your document to proceed.', d.done ? 'success' : 'info')}
          className={`border-[1.5px] rounded-xl px-5 py-4 flex items-center justify-between mb-3 cursor-pointer transition-colors
            ${d.done ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-brand hover:bg-brand-pale'}`}
        >
          <div>
            <div className="text-sm font-semibold">{d.label}</div>
            <div className={`text-xs mt-0.5 ${d.done ? 'text-green-600' : 'text-gray-400'}`}>{d.note}</div>
          </div>
          <Badge status={d.done ? 'Active' : 'Pending'} />
        </div>
      ))}
      <div className="mt-6 bg-surface border border-gray-100 rounded-xl p-5">
        <div className="text-sm font-semibold mb-3">Upload New Document</div>
        <UploadZone onClick={() => toast('Document uploaded successfully!', 'success')} />
      </div>
    </>
  )
}

// ── Renewals Tab ──────────────────────────────────────────
function RenewalsTab({ toast }) {
  return (
    <>
      <h3 className="font-display text-2xl font-bold mb-5">Renewal Schedule</h3>
      <Card>
        <Table headers={['Policy','Type','Expiry','Days Left','Premium','Action']}>
          <TR>
            <TD><span className="font-mono-dm text-xs">SHX-VI-2024-00123</span></TD>
            <TD>🚗 Vehicle</TD>
            <TD>Mar 29, 2026</TD>
            <TD><span className="text-red-500 font-bold">28 days</span></TD>
            <TD>₹8,850/yr</TD>
            <TD><BtnSm onClick={() => toast('Redirecting to payment gateway…','info')} variant="green">Pay Now</BtnSm></TD>
          </TR>
          <TR>
            <TD><span className="font-mono-dm text-xs">SHX-HI-2024-00291</span></TD>
            <TD>❤️ Health</TD>
            <TD>Sep 5, 2026</TD>
            <TD><span className="text-gray-400">188 days</span></TD>
            <TD>₹15,600/yr</TD>
            <TD><BtnSm onClick={() => toast('Reminder set for 30 days before expiry','success')} variant="blue">Set Reminder</BtnSm></TD>
          </TR>
        </Table>
      </Card>
    </>
  )
}

// ── Documents Tab ─────────────────────────────────────────
function DocumentsTab({ onCert }) {
  return (
    <>
      <h3 className="font-display text-2xl font-bold mb-5">Policy Certificates</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POLICIES.filter(p => p.status === 'Active').map(p => {
          const bg = p.type === 'Health' ? 'bg-blue-700' : p.type === 'Vehicle' ? 'bg-amber-700' : 'bg-brand'
          return (
            <div key={p.id}
              onClick={() => onCert(p)}
              className="border border-gray-100 rounded-2xl overflow-hidden cursor-pointer shadow-card hover:shadow-float transition-shadow"
            >
              <div className={`${bg} px-5 py-4 flex items-center gap-3`}>
                <span className="text-2xl">📄</span>
                <div>
                  <div className="text-white font-semibold text-sm">{p.type} Insurance Certificate</div>
                  <div className="text-white/60 font-mono-dm text-xs">{p.id}</div>
                </div>
              </div>
              <div className="px-5 py-3 text-xs text-gray-400">Issued: {p.issued} · PDF</div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Dashboard Page ────────────────────────────────────────
export default function DashboardPage() {
  const toast = useToast()
  const { user } = useAuth()
  const [tab,       setTab]       = useState('overview')
  const [certPolicy, setCertPolicy] = useState(null)
  const [claimModal, setClaimModal] = useState(false)
  const [timeline,   setTimeline]   = useState(null)
  const [newPolicy,  setNewPolicy]  = useState(false)

  // Use real user data, fall back to placeholder if somehow not logged in
  const displayName  = user?.full_name  || 'My Account'
  const displayEmail = user?.email      || ''
  const avatarLetter = (user?.full_name || 'U').charAt(0).toUpperCase()

  return (
    <>
      <div className="grid grid-cols-[240px_1fr] min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="bg-white border-r border-gray-100 px-3 py-5 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto hidden md:flex flex-col">
          {/* User */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-base">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{displayName}</div>
              <div className="text-xs text-gray-400 truncate">{displayEmail}</div>
            </div>
          </div>

          {/* Nav */}
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mb-2">Overview</div>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors text-left
                ${tab === t.id ? 'bg-brand-pale text-brand font-semibold' : 'text-gray-500 hover:bg-brand-pale hover:text-brand'}`}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}

          {/* Help box */}
          <div className="mt-auto mx-2 bg-brand-pale rounded-xl p-4 text-sm">
            <div className="font-semibold text-brand mb-1">Need help?</div>
            <div className="text-gray-400 text-xs leading-relaxed">Our support team is available 24/7 for claims and queries.</div>
            <div className="mt-2 text-brand text-xs font-semibold cursor-pointer hover:underline" onClick={() => toast('Opening chat…','info')}>Chat with us →</div>
          </div>
        </aside>

        {/* Main */}
        <main className="p-6 overflow-y-auto">
          <RenewalBanner onRenew={() => toast('Redirecting to payment gateway…','info')} />

          <div className="text-sm text-gray-400 mb-5">
            Dashboard / <span className="text-gray-900 font-medium capitalize">{tab}</span>
          </div>

          {tab === 'overview'  && <OverviewTab  onCert={setCertPolicy} onClaim={() => setClaimModal(true)} onTimeline={setTimeline} onNewPolicy={() => setNewPolicy(true)} />}
          {tab === 'policies'  && <PoliciesTab  onCert={setCertPolicy} />}
          {tab === 'claims'    && <ClaimsTab    onNewClaim={() => setClaimModal(true)} onTimeline={setTimeline} />}
          {tab === 'documents' && <DocumentsTab onCert={setCertPolicy} />}
          {tab === 'kyc'       && <KYCTab       toast={toast} />}
          {tab === 'renewals'  && <RenewalsTab  toast={toast} />}
        </main>
      </div>

      {certPolicy && <PolicyCertModal policy={certPolicy} onClose={() => setCertPolicy(null)} />}
      {claimModal  && <ClaimModal   onClose={() => setClaimModal(false)} />}
      {timeline    && <ClaimTimelineModal claim={timeline} onClose={() => setTimeline(null)} />}
      {newPolicy   && <PurchaseModal onClose={() => setNewPolicy(false)} />}
    </>
  )
}
