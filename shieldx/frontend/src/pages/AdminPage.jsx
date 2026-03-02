import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../App'
import { adminAPI, policiesAPI, kycAPI, productsAPI } from '../services/api'

const TABS = [
  { id: 'analytics', label: '📊 Analytics'    },
  { id: 'policies',  label: '📄 Policy Review' },
  { id: 'kyc',       label: '🪪 KYC Queue'     },
  { id: 'products',  label: '📦 Products'      },
  { id: 'users',     label: '👥 Users'         },
]

function DarkStat({ label, value, color = 'text-white', sub }) {
  return (
    <div className="bg-[#140b2e] border border-[#2d1b4e] rounded-xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">{label}</div>
      <div className={`font-display text-2xl font-bold ${color}`}>{value ?? '—'}</div>
      {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
    </div>
  )
}

function DarkCard({ title, action, children }) {
  return (
    <div className="bg-[#140b2e] border border-[#2d1b4e] rounded-xl overflow-hidden mb-4">
      {title && (
        <div className="px-6 py-4 border-b border-[#2d1b4e] flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

function Spinner() {
  return <div className="flex items-center justify-center py-16 text-white/30 text-sm">Loading data…</div>
}

function StatusPill({ status }) {
  const colors = {
    pending:      'bg-yellow-900/50 text-yellow-400',
    active:       'bg-green-900/50  text-green-400',
    rejected:     'bg-red-900/50    text-red-400',
    expired:      'bg-gray-800      text-gray-400',
    verified:     'bg-green-900/50  text-green-400',
    under_review: 'bg-blue-900/50   text-blue-400',
    cancelled:    'bg-gray-800      text-gray-500',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${colors[status] || 'bg-white/10 text-white/60'}`}>
      {status?.replace(/_/g,' ')}
    </span>
  )
}

// ── ANALYTICS TAB ─────────────────────────────────────────
function AnalyticsTab() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    adminAPI.analytics()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error)   return <div className="text-red-400 py-8 text-center">{error}</div>

  const p = data?.policies || {}
  const c = data?.claims   || {}
  const m = data?.premiums || {}

  return (
    <>
      <div className="mb-2 text-white/30 text-[10px] uppercase tracking-widest font-semibold">Policies</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DarkStat label="Total"   value={p.total} />
        <DarkStat label="Active"  value={p.active}  color="text-green-400" />
        <DarkStat label="Pending" value={p.pending} color="text-yellow-400" />
        <DarkStat label="Expired" value={p.expired} color="text-red-400" />
      </div>

      <div className="mb-2 text-white/30 text-[10px] uppercase tracking-widest font-semibold">Claims</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DarkStat label="Total Filed"    value={c.total} />
        <DarkStat label="Under Review"   value={c.under_review} color="text-blue-400" />
        <DarkStat label="Approved"       value={c.approved}     color="text-green-400" />
        <DarkStat label="Total Disbursed"value={`₹${Number(c.total_disbursed||0).toLocaleString('en-IN')}`} color="text-purple-400" />
      </div>

      <div className="mb-2 text-white/30 text-[10px] uppercase tracking-widest font-semibold">Revenue</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DarkStat label="Premiums Collected" value={`₹${Number(m.total_collected||0).toLocaleString('en-IN')}`} color="text-accent" />
        <DarkStat label="Transactions"       value={m.payment_count} />
        <DarkStat label="KYC Pending"        value={data?.kyc_pending} color="text-orange-400" />
        <DarkStat label="Submitted Claims"   value={c.submitted} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data?.by_type?.length > 0 && (
          <DarkCard title="Policy Distribution by Type">
            <div className="p-6 space-y-4">
              {data.by_type.map(t => {
                const total = data.by_type.reduce((a, b) => a + +b.count, 0) || 1
                const pct   = Math.round((+t.count / total) * 100)
                const icon  = { life:'🌿', health:'❤️', vehicle:'🚗' }[t.type] || '📋'
                return (
                  <div key={t.type}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-white/70 text-sm">{icon} {t.type} · {t.count} policies</span>
                      <span className="text-white font-semibold text-sm">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-light to-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </DarkCard>
        )}

        {data?.recent_audit?.length > 0 && (
          <DarkCard title="Recent Audit Log">
            <div className="p-5">
              {data.recent_audit.map((log, i) => (
                <div key={i} className="font-mono-dm text-[11px] text-white/35 leading-[1.9]">
                  [{new Date(log.created_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' })}]{' '}
                  <span className="text-white/50">{log.action}</span>
                  {log.full_name ? <span className="text-white/30"> — {log.full_name}</span> : ''}
                </div>
              ))}
            </div>
          </DarkCard>
        )}
      </div>
    </>
  )
}

// ── POLICY REVIEW TAB ─────────────────────────────────────
function PoliciesTab({ toast }) {
  const [policies, setPolicies] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState({})

  useEffect(() => {
    policiesAPI.all({ status: 'pending', limit: 50 })
      .then(d => setPolicies(d.policies || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const decide = async (id, action, policyNumber) => {
    const rejection_reason = action === 'reject' ? 'Does not meet current underwriting criteria.' : undefined
    setActing(p => ({ ...p, [id]: action }))
    try {
      await policiesAPI.approve(id, { action, rejection_reason })
      toast(
        action === 'approve'
          ? `✅ ${policyNumber} approved — certificate generated`
          : `❌ ${policyNumber} rejected — applicant notified`,
        action === 'approve' ? 'success' : 'info'
      )
      setPolicies(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast(err.message, 'error')
      setActing(p => ({ ...p, [id]: null }))
    }
  }

  if (loading) return <Spinner />

  return (
    <DarkCard title={`📋 Pending Policy Applications (${policies.length})`}>
      {policies.length === 0
        ? <div className="py-16 text-center text-white/30">No pending applications 🎉</div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a0a2e]">
                  {['Policy #','Customer','Email','Type','Sum Assured','Premium/yr','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map(p => (
                  <tr key={p.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                    <td className="px-5 py-4 text-xs font-mono-dm text-white/60">{p.policy_number}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-white">{p.full_name}</td>
                    <td className="px-5 py-4 text-xs text-white/40">{p.email}</td>
                    <td className="px-5 py-4 text-sm text-white/70 capitalize">{p.type}</td>
                    <td className="px-5 py-4 text-sm font-mono-dm text-white/70">₹{Number(p.sum_assured).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-sm font-mono-dm text-white/70">₹{Number(p.total_premium).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4">
                      {acting[p.id]
                        ? <span className={`text-xs font-bold ${acting[p.id]==='approve'?'text-green-400':'text-red-400'}`}>
                            {acting[p.id]==='approve'?'✅ Approved':'❌ Rejected'}
                          </span>
                        : <div className="flex gap-2">
                            <button onClick={()=>decide(p.id,'approve',p.policy_number)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors">✓ Approve</button>
                            <button onClick={()=>decide(p.id,'reject',p.policy_number)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors">✗ Reject</button>
                          </div>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </DarkCard>
  )
}

// ── KYC QUEUE TAB ─────────────────────────────────────────
function KYCTab({ toast }) {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState({})

  useEffect(() => {
    kycAPI.pending()
      .then(d => setDocs(d.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const act = async (id, action, name) => {
    setActing(p => ({ ...p, [id]: action }))
    try {
      await kycAPI.verify(id, { action, rejection_note: action === 'reject' ? 'Document unclear or invalid.' : undefined })
      toast(action === 'verify' ? `✅ KYC verified for ${name}` : `KYC rejected for ${name}`, action === 'verify' ? 'success' : 'info')
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      toast(err.message, 'error')
      setActing(p => ({ ...p, [id]: null }))
    }
  }

  if (loading) return <Spinner />

  return (
    <DarkCard title={`🪪 Pending KYC Documents (${docs.length})`}>
      {docs.length === 0
        ? <div className="py-16 text-center text-white/30">No pending KYC documents 🎉</div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a0a2e]">
                  {['Customer','Email','Document','Uploaded','Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                    <td className="px-5 py-4 text-sm font-semibold text-white">{doc.full_name}</td>
                    <td className="px-5 py-4 text-xs text-white/40">{doc.email}</td>
                    <td className="px-5 py-4 text-sm text-white/70 capitalize">{doc.doc_type?.replace(/_/g,' ')}</td>
                    <td className="px-5 py-4 text-xs text-white/40">{new Date(doc.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-4">
                      {acting[doc.id]
                        ? <span className={`text-xs font-bold ${acting[doc.id]==='verify'?'text-green-400':'text-red-400'}`}>
                            {acting[doc.id]==='verify'?'✅ Verified':'❌ Rejected'}
                          </span>
                        : <div className="flex gap-2">
                            <button onClick={()=>act(doc.id,'verify',doc.full_name)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors">Verify</button>
                            <button onClick={()=>act(doc.id,'reject',doc.full_name)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors">Reject</button>
                          </div>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </DarkCard>
  )
}

// ── PRODUCTS TAB ──────────────────────────────────────────
function ProductsTab({ toast }) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    productsAPI.list()
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <DarkCard title="📦 Insurance Products"
      action={
        <button onClick={() => toast('Product creation — coming soon', 'info')}
          className="bg-accent hover:bg-accent-dark text-brand-dark text-xs font-bold px-3 py-1.5 rounded-lg">
          + New Product
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1a0a2e]">
              {['Product','Type','Base Premium','Age Range','Max Coverage','Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                <td className="px-5 py-4 text-sm font-semibold text-white">{p.name}</td>
                <td className="px-5 py-4 text-sm text-white/70 capitalize">
                  {{'life':'🌿','health':'❤️','vehicle':'🚗'}[p.type]} {p.type}
                </td>
                <td className="px-5 py-4 text-sm font-mono-dm text-white/70">
                  {+p.base_premium > 0 ? `₹${Number(p.base_premium).toLocaleString('en-IN')}/yr` : '2% of IDV'}
                </td>
                <td className="px-5 py-4 text-sm text-white/70">{p.min_age}–{p.max_age} yrs</td>
                <td className="px-5 py-4 text-sm font-mono-dm text-white/70">
                  {p.max_coverage ? `₹${(+p.max_coverage/100000).toFixed(0)}L` : 'IDV-based'}
                </td>
                <td className="px-5 py-4"><StatusPill status={p.is_active ? 'active' : 'rejected'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DarkCard>
  )
}

// ── USERS TAB ─────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.users()
      .then(d => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const roleColor = { admin:'text-red-400', underwriter:'text-blue-400', adjuster:'text-purple-400', customer:'text-green-400' }

  return (
    <DarkCard title={`👥 All Users (${users.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1a0a2e]">
              {['Name','Email','Phone','Role','Verified','Joined'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                <td className="px-5 py-4 text-sm font-semibold text-white">{u.full_name}</td>
                <td className="px-5 py-4 text-xs text-white/40">{u.email}</td>
                <td className="px-5 py-4 text-xs text-white/40">{u.phone||'—'}</td>
                <td className={`px-5 py-4 text-xs font-bold capitalize ${roleColor[u.role]}`}>{u.role}</td>
                <td className="px-5 py-4 text-xs">{u.email_verified ? <span className="text-green-400">✓</span> : <span className="text-yellow-400">Pending</span>}</td>
                <td className="px-5 py-4 text-xs text-white/40">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DarkCard>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function AdminPage() {
  const toast      = useToast()
  const { user }   = useAuth()
  const [tab, setTab] = useState('analytics')

  return (
    <div className="bg-[#0d0720] min-h-[calc(100vh-64px)]">
      <div className="bg-[#1a0a2e] border-b border-[#2d1b4e] px-6">
        <div className="max-w-screen-xl mx-auto h-12 flex items-center gap-1">
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest mr-3">Admin</span>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab===t.id ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot"/>
            <span className="text-white/40 text-xs">{user?.full_name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto p-6">
        {tab==='analytics' && <AnalyticsTab />}
        {tab==='policies'  && <PoliciesTab  toast={toast} />}
        {tab==='kyc'       && <KYCTab       toast={toast} />}
        {tab==='products'  && <ProductsTab  toast={toast} />}
        {tab==='users'     && <UsersTab />}
      </div>
    </div>
  )
}
