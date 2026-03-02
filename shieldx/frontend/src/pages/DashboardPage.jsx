import React, { useState, useEffect, useCallback } from 'react'
import { Badge, Card, StatCard, Table, TR, TD, BtnSm, UploadZone } from '../components/ui'
import PolicyCertModal from '../components/PolicyCertModal'
import ClaimModal from '../components/ClaimModal'
import ClaimTimelineModal from '../components/ClaimTimelineModal'
import PurchaseModal from '../components/PurchaseModal'
import { useToast } from '../App'
import { useAuth } from '../context/AuthContext'
import { policiesAPI, claimsAPI, kycAPI } from '../services/api'

const TABS = [
  { id: 'overview',  icon: '🏠', label: 'Overview'    },
  { id: 'policies',  icon: '📄', label: 'My Policies' },
  { id: 'claims',    icon: '📋', label: 'Claims'      },
  { id: 'documents', icon: '📁', label: 'Documents'   },
  { id: 'kyc',       icon: '🪪', label: 'KYC Status'  },
  { id: 'renewals',  icon: '🔄', label: 'Renewals'    },
]

const TYPE_ICON = { life: '🌿', health: '❤️', vehicle: '🚗' }
const TYPE_BG   = { life: 'bg-brand', health: 'bg-blue-700', vehicle: 'bg-amber-700' }

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-300 text-sm">
      Loading…
    </div>
  )
}

function Empty({ icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-semibold text-gray-700 mb-1">{title}</div>
      <div className="text-sm text-gray-400 mb-5">{sub}</div>
      {action}
    </div>
  )
}

// Days until a date
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ── Renewal Banner ────────────────────────────────────────
function RenewalBanner({ policies, onRenew }) {
  const due = policies.find(p => {
    const d = daysUntil(p.end_date)
    return (p.status === 'active' || p.status === 'renewal_due') && d <= 30 && d >= 0
  })
  if (!due) return null
  const days = daysUntil(due.end_date)
  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-xl px-5 py-4 flex items-center justify-between mb-6">
      <div>
        <div className="text-sm font-semibold text-amber-900">
          ⚠ Renewal Due: Your {due.type} Insurance{' '}
          <span className="font-mono-dm">{due.policy_number}</span>{' '}
          expires in <strong>{days} day{days !== 1 ? 's' : ''}</strong>
        </div>
        <div className="text-xs text-amber-700 mt-0.5">
          Renew before {fmt(due.end_date)} to avoid a coverage gap.
        </div>
      </div>
      <button onClick={() => onRenew(due)}
        className="shrink-0 ml-4 bg-accent hover:bg-accent-dark text-brand-dark text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-glow">
        Renew Now
      </button>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────
function OverviewTab({ policies, claims, loading, onCert, onClaim, onNewPolicy }) {
  if (loading) return <Spinner />

  const active   = policies.filter(p => p.status === 'active')
  const annualPremium = active.reduce((sum, p) => sum + (+p.total_premium || 0), 0)
  const pending  = claims.filter(c => ['submitted','under_review'].includes(c.status)).length
  const approved = claims.filter(c => c.status === 'approved' || c.status === 'disbursed').length

  const nearest  = active
    .filter(p => p.end_date)
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))[0]

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Policies" value={active.length || 0}
          change={active.length ? `${active.length} active` : 'None yet'} changeType={active.length ? 'up' : 'neutral'} />
        <StatCard label="Annual Premium"  value={annualPremium ? fmtMoney(annualPremium) : '—'}
          change={annualPremium ? `Tax saving: ${fmtMoney(Math.round(annualPremium * 0.3))}` : 'No policies yet'} changeType={annualPremium ? 'up' : 'neutral'} />
        <StatCard label="Claims Filed"    value={claims.length || 0}
          change={claims.length ? `${approved} settled, ${pending} pending` : 'No claims yet'} />
        <StatCard label="Next Renewal"    value={nearest ? fmt(nearest.end_date).split(' ')[0]+' '+fmt(nearest.end_date).split(' ')[1] : '—'}
          change={nearest ? `⚠ ${daysUntil(nearest.end_date)} days remaining` : 'No renewals due'}
          changeType={nearest && daysUntil(nearest.end_date) < 30 ? 'down' : 'neutral'} />
      </div>

      <Card className="mb-5">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Active Policies</h3>
          <button onClick={onNewPolicy}
            className="bg-brand hover:bg-brand-light text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Policy
          </button>
        </div>
        {policies.length === 0 ? (
          <Empty icon="📄" title="No policies yet"
            sub="Purchase your first insurance policy to get started."
            action={<button onClick={onNewPolicy} className="bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl">Get Covered →</button>} />
        ) : (
          <Table headers={['Policy Number','Type','Sum Assured','Premium','Status','Expiry','Actions']}>
            {policies.map(p => (
              <TR key={p.id}>
                <TD><span className="font-mono-dm text-xs">{p.policy_number}</span></TD>
                <TD>{TYPE_ICON[p.type]} {p.type}</TD>
                <TD>{fmtMoney(p.sum_assured)}</TD>
                <TD>{fmtMoney(p.total_premium)}/yr</TD>
                <TD><Badge status={p.status === 'active' ? 'Active' : p.status === 'pending' ? 'Pending' : p.status === 'renewal_due' ? 'Renewal Due' : p.status} /></TD>
                <TD>{fmt(p.end_date)}</TD>
                <TD>
                  {p.status === 'active'
                    ? <BtnSm onClick={() => onCert(p)} variant="blue">📄 Certificate</BtnSm>
                    : p.status === 'renewal_due'
                    ? <BtnSm onClick={() => onNewPolicy()} variant="green">🔄 Renew</BtnSm>
                    : <Badge status="Pending" />}
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Recent Claims</h3>
          <BtnSm onClick={onClaim} variant="blue">+ File Claim</BtnSm>
        </div>
        {claims.length === 0 ? (
          <Empty icon="📋" title="No claims filed" sub="File a claim when you need to." />
        ) : (
          <Table headers={['Claim #','Policy','Description','Amount','Status','Filed']}>
            {claims.slice(0, 5).map(c => (
              <TR key={c.id}>
                <TD><span className="font-mono-dm text-xs">{c.claim_number}</span></TD>
                <TD>{TYPE_ICON[c.policy_type]} {c.policy_type}</TD>
                <TD className="max-w-[180px] truncate">{c.description}</TD>
                <TD>{fmtMoney(c.claim_amount)}</TD>
                <TD><Badge status={c.status === 'submitted' ? 'Pending' : c.status === 'under_review' ? 'Under Review' : c.status === 'approved' ? 'Approved' : c.status === 'disbursed' ? 'Disbursed' : c.status} /></TD>
                <TD>{fmt(c.created_at)}</TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

// ── Policies Tab ──────────────────────────────────────────
function PoliciesTab({ policies, loading, onCert, onNewPolicy }) {
  if (loading) return <Spinner />
  return (
    <Card>
      {policies.length === 0 ? (
        <Empty icon="📄" title="No policies yet" sub="Your purchased policies will appear here."
          action={<button onClick={onNewPolicy} className="bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl">Buy Your First Policy →</button>} />
      ) : (
        <Table headers={['Policy Number','Type','Sum Assured','Premium/yr','Status','Expiry','Actions']}>
          {policies.map(p => (
            <TR key={p.id}>
              <TD><span className="font-mono-dm text-xs">{p.policy_number}</span></TD>
              <TD>{TYPE_ICON[p.type]} {p.type} Insurance</TD>
              <TD>{fmtMoney(p.sum_assured)}</TD>
              <TD>{fmtMoney(p.total_premium)}</TD>
              <TD><Badge status={p.status === 'active' ? 'Active' : p.status === 'pending' ? 'Pending' : 'Renewal Due'} /></TD>
              <TD>{fmt(p.end_date)}</TD>
              <TD>
                {p.status === 'active'
                  ? <BtnSm onClick={() => onCert(p)} variant="blue">📄 Download</BtnSm>
                  : p.status === 'renewal_due'
                  ? <BtnSm variant="green">🔄 Renew</BtnSm>
                  : <span className="text-xs text-gray-400">Pending approval</span>}
              </TD>
            </TR>
          ))}
        </Table>
      )}
    </Card>
  )
}

// ── Claims Tab ────────────────────────────────────────────
function ClaimsTab({ claims, policies, loading, onNewClaim, onTimeline }) {
  if (loading) return <Spinner />
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
        {claims.length === 0 ? (
          <Empty icon="📋" title="No claims filed" sub="When you file a claim, it will appear here with live status tracking." />
        ) : (
          <Table headers={['Claim #','Policy','Description','Amount','Status','Filed','Timeline']}>
            {claims.map(c => (
              <TR key={c.id}>
                <TD><span className="font-mono-dm text-xs">{c.claim_number}</span></TD>
                <TD>{TYPE_ICON[c.policy_type]} {c.policy_type}</TD>
                <TD className="max-w-[180px] truncate">{c.description}</TD>
                <TD>{fmtMoney(c.claim_amount)}</TD>
                <TD><Badge status={
                  c.status === 'submitted' ? 'Pending'
                  : c.status === 'under_review' ? 'Under Review'
                  : c.status === 'approved' ? 'Approved'
                  : c.status === 'disbursed' ? 'Disbursed'
                  : 'Rejected'
                } /></TD>
                <TD>{fmt(c.created_at)}</TD>
                <TD><BtnSm onClick={() => onTimeline(c)} variant="blue">View</BtnSm></TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

// ── KYC Tab ───────────────────────────────────────────────
function KYCTab({ toast }) {
  const [docs,     setDocs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType,  setDocType]  = useState('aadhaar')

  const load = () => {
    kycAPI.my()
      .then(d => setDocs(d.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('document', file)
    fd.append('doc_type', docType)
    try {
      await kycAPI.upload(fd)
      toast('Document uploaded! Pending verification by our team.', 'success')
      load()
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const DOC_LABELS = {
    aadhaar:        { label: '🪪 Aadhaar Card',   note: 'Front & back scan required' },
    pan:            { label: '📋 PAN Card',        note: 'For income verification' },
    driving_license:{ label: '🚗 Driving License', note: 'Required for Vehicle Insurance' },
    passport:       { label: '🛂 Passport',        note: 'Valid passport front page' },
    address_proof:  { label: '🏠 Address Proof',   note: 'Utility bill or bank statement' },
  }

  if (loading) return <Spinner />

  return (
    <>
      <h3 className="font-display text-2xl font-bold mb-1">KYC Verification</h3>
      <p className="text-sm text-gray-400 mb-6">All documents are AES-256 encrypted. Required for policy issuance.</p>

      {docs.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm mb-4">
          No documents uploaded yet. Upload below to get started.
        </div>
      )}

      {docs.map(d => {
        const info = DOC_LABELS[d.doc_type] || { label: d.doc_type, note: '' }
        const verified = d.status === 'verified'
        const pending  = d.status === 'pending'
        return (
          <div key={d.id}
            className={`border-[1.5px] rounded-xl px-5 py-4 flex items-center justify-between mb-3
              ${verified ? 'border-green-200 bg-green-50'
              : pending  ? 'border-yellow-200 bg-yellow-50'
              : 'border-red-200 bg-red-50'}`}>
            <div>
              <div className="text-sm font-semibold">{info.label}</div>
              <div className={`text-xs mt-0.5 ${verified ? 'text-green-600' : pending ? 'text-yellow-700' : 'text-red-600'}`}>
                {verified ? `✓ Verified on ${fmt(d.verified_at || d.created_at)}`
                : pending ? 'Pending review by our team'
                : `Rejected: ${d.rejection_note || 'Please re-upload'}`}
              </div>
            </div>
            <Badge status={verified ? 'Active' : pending ? 'Pending' : 'Rejected'} />
          </div>
        )
      })}

      <div className="mt-6 bg-surface border border-gray-100 rounded-xl p-5">
        <div className="text-sm font-semibold mb-3">Upload New Document</div>
        <div className="mb-3">
          <select value={docType} onChange={e => setDocType(e.target.value)}
            className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand">
            {Object.entries(DOC_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center cursor-pointer hover:border-brand hover:bg-brand-pale transition-colors">
          <span className="text-3xl mb-2">📎</span>
          <span className="text-sm font-semibold text-gray-700">
            {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
          </span>
          <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </>
  )
}

// ── Renewals Tab ──────────────────────────────────────────
function RenewalsTab({ policies, loading, toast }) {
  if (loading) return <Spinner />

  const renewable = policies.filter(p =>
    (p.status === 'active' || p.status === 'renewal_due') && p.end_date
  ).sort((a, b) => new Date(a.end_date) - new Date(b.end_date))

  return (
    <>
      <h3 className="font-display text-2xl font-bold mb-5">Renewal Schedule</h3>
      {renewable.length === 0 ? (
        <Card>
          <Empty icon="🔄" title="No renewals scheduled" sub="Your active policies and their renewal dates will appear here." />
        </Card>
      ) : (
        <Card>
          <Table headers={['Policy','Type','Expiry','Days Left','Premium/yr','Action']}>
            {renewable.map(p => {
              const days = daysUntil(p.end_date)
              const urgent = days <= 30
              return (
                <TR key={p.id}>
                  <TD><span className="font-mono-dm text-xs">{p.policy_number}</span></TD>
                  <TD>{TYPE_ICON[p.type]} {p.type}</TD>
                  <TD>{fmt(p.end_date)}</TD>
                  <TD><span className={urgent ? 'text-red-500 font-bold' : 'text-gray-400'}>{days} days</span></TD>
                  <TD>{fmtMoney(p.total_premium)}</TD>
                  <TD>
                    {urgent
                      ? <BtnSm onClick={() => toast('Redirecting to payment…', 'info')} variant="green">Pay Now</BtnSm>
                      : <BtnSm onClick={() => toast('Reminder set for 30 days before expiry', 'success')} variant="blue">Set Reminder</BtnSm>
                    }
                  </TD>
                </TR>
              )
            })}
          </Table>
        </Card>
      )}
    </>
  )
}

// ── Documents Tab ─────────────────────────────────────────
function DocumentsTab({ policies, loading, onCert }) {
  if (loading) return <Spinner />

  const active = policies.filter(p => p.status === 'active')
  return (
    <>
      <h3 className="font-display text-2xl font-bold mb-5">Policy Certificates</h3>
      {active.length === 0 ? (
        <Empty icon="📁" title="No certificates yet" sub="Certificates are generated when your policy is approved and active." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map(p => (
            <div key={p.id} onClick={() => onCert(p)}
              className="border border-gray-100 rounded-2xl overflow-hidden cursor-pointer shadow-card hover:shadow-float transition-shadow">
              <div className={`${TYPE_BG[p.type] || 'bg-brand'} px-5 py-4 flex items-center gap-3`}>
                <span className="text-2xl">📄</span>
                <div>
                  <div className="text-white font-semibold text-sm capitalize">{p.type} Insurance Certificate</div>
                  <div className="text-white/60 font-mono-dm text-xs">{p.policy_number}</div>
                </div>
              </div>
              <div className="px-5 py-3 text-xs text-gray-400">
                Issued: {fmt(p.start_date)} · PDF
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── Dashboard Page ────────────────────────────────────────
export default function DashboardPage() {
  const toast    = useToast()
  const { user } = useAuth()

  const [tab,        setTab]        = useState('overview')
  const [certPolicy, setCertPolicy] = useState(null)
  const [claimModal, setClaimModal] = useState(false)
  const [timeline,   setTimeline]   = useState(null)
  const [newPolicy,  setNewPolicy]  = useState(false)

  // ── Data state ─────────────────────────────────────────
  const [policies,   setPolicies]   = useState([])
  const [claims,     setClaims]     = useState([])
  const [loadingP,   setLoadingP]   = useState(true)
  const [loadingC,   setLoadingC]   = useState(true)

  const loadPolicies = useCallback(() => {
    setLoadingP(true)
    policiesAPI.my()
      .then(d => setPolicies(d.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoadingP(false))
  }, [])

  const loadClaims = useCallback(() => {
    setLoadingC(true)
    claimsAPI.my()
      .then(d => setClaims(d.claims || []))
      .catch(() => setClaims([]))
      .finally(() => setLoadingC(false))
  }, [])

  useEffect(() => { loadPolicies(); loadClaims() }, [])

  const onClaimModalClose = (submitted) => {
    setClaimModal(false)
    if (submitted) { loadClaims(); loadPolicies() }
  }

  const onNewPolicyClose = (purchased) => {
    setNewPolicy(false)
    if (purchased) loadPolicies()
  }

  const avatarLetter = (user?.full_name || 'U').charAt(0).toUpperCase()

  return (
    <>
      <div className="grid grid-cols-[240px_1fr] min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="bg-white border-r border-gray-100 px-3 py-5 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto hidden md:flex flex-col">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-base">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{user?.full_name || 'My Account'}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mb-2">Overview</div>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors text-left
                ${tab === t.id ? 'bg-brand-pale text-brand font-semibold' : 'text-gray-500 hover:bg-brand-pale hover:text-brand'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}

          <div className="mt-auto mx-2 bg-brand-pale rounded-xl p-4 text-sm">
            <div className="font-semibold text-brand mb-1">Need help?</div>
            <div className="text-gray-400 text-xs leading-relaxed">Our support team is available 24/7 for claims and queries.</div>
            <div className="mt-2 text-brand text-xs font-semibold cursor-pointer hover:underline"
              onClick={() => toast('Opening support chat…', 'info')}>Chat with us →</div>
          </div>
        </aside>

        {/* Main */}
        <main className="p-6 overflow-y-auto">
          <RenewalBanner policies={policies} onRenew={() => toast('Redirecting to payment gateway…', 'info')} />

          <div className="text-sm text-gray-400 mb-5">
            Dashboard / <span className="text-gray-900 font-medium capitalize">{tab}</span>
          </div>

          {tab === 'overview'  && <OverviewTab  policies={policies} claims={claims} loading={loadingP || loadingC} onCert={setCertPolicy} onClaim={() => setClaimModal(true)} onTimeline={setTimeline} onNewPolicy={() => setNewPolicy(true)} />}
          {tab === 'policies'  && <PoliciesTab  policies={policies} loading={loadingP} onCert={setCertPolicy} onNewPolicy={() => setNewPolicy(true)} />}
          {tab === 'claims'    && <ClaimsTab    claims={claims} policies={policies} loading={loadingC} onNewClaim={() => setClaimModal(true)} onTimeline={setTimeline} />}
          {tab === 'documents' && <DocumentsTab policies={policies} loading={loadingP} onCert={setCertPolicy} />}
          {tab === 'kyc'       && <KYCTab       toast={toast} />}
          {tab === 'renewals'  && <RenewalsTab  policies={policies} loading={loadingP} toast={toast} />}
        </main>
      </div>

      {certPolicy && <PolicyCertModal policy={certPolicy} onClose={() => setCertPolicy(null)} />}
      {claimModal && <ClaimModal policies={policies} onClose={onClaimModalClose} />}
      {timeline   && <ClaimTimelineModal claim={timeline} onClose={() => setTimeline(null)} />}
      {newPolicy  && <PurchaseModal onClose={onNewPolicyClose} />}
    </>
  )
}
