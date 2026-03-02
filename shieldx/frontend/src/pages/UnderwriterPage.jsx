import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../App'
import { policiesAPI, kycAPI } from '../services/api'

function DarkStat({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#140b2e] border border-[#2d1b4e] rounded-xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">{label}</div>
      <div className={`font-display text-2xl font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  )
}

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

export default function UnderwriterPage() {
  const { user } = useAuth()
  const toast    = useToast()

  const [policies, setPolicies] = useState([])
  const [kycDocs,  setKycDocs]  = useState([])
  const [loadingP, setLoadingP] = useState(true)
  const [loadingK, setLoadingK] = useState(true)
  const [actingP,  setActingP]  = useState({})
  const [actingK,  setActingK]  = useState({})
  const [approved, setApproved] = useState(0)
  const [rejected, setRejected] = useState(0)

  const loadAll = () => {
    setLoadingP(true)
    setLoadingK(true)
    policiesAPI.all({ status: 'pending', limit: 50 })
      .then(d => setPolicies(d.policies || []))
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoadingP(false))
    kycAPI.pending()
      .then(d => setKycDocs(d.documents || []))
      .catch(() => {})
      .finally(() => setLoadingK(false))
  }

  useEffect(loadAll, [])

  const decidePolicy = async (id, action, policyNumber) => {
    setActingP(p => ({ ...p, [id]: action }))
    try {
      await policiesAPI.approve(id, {
        action,
        rejection_reason: action === 'reject' ? 'Does not meet current underwriting criteria.' : undefined,
      })
      toast(
        action === 'approve'
          ? `✅ ${policyNumber} approved — certificate being generated`
          : `❌ ${policyNumber} rejected — applicant notified`,
        action === 'approve' ? 'success' : 'info'
      )
      if (action === 'approve') setApproved(n => n + 1)
      else setRejected(n => n + 1)
      setPolicies(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast(err.message, 'error')
      setActingP(p => ({ ...p, [id]: null }))
    }
  }

  const decideKYC = async (id, action, name) => {
    setActingK(p => ({ ...p, [id]: action }))
    try {
      await kycAPI.verify(id, {
        action,
        rejection_note: action === 'reject' ? 'Document unclear or invalid.' : undefined,
      })
      toast(action === 'verify' ? `✅ KYC verified for ${name}` : `KYC rejected for ${name}`, action === 'verify' ? 'success' : 'info')
      setKycDocs(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      toast(err.message, 'error')
      setActingK(p => ({ ...p, [id]: null }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0720] text-white">
      {/* Header */}
      <div className="bg-[#140b2e] border-b border-[#2d1b4e] px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Underwriter Portal</h1>
            <p className="text-white/50 text-sm mt-0.5">Welcome, {user?.full_name} — Review applications and KYC documents</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              ↻ Refresh
            </button>
            <div className="w-9 h-9 rounded-full bg-accent text-brand-dark flex items-center justify-center font-bold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DarkStat label="Pending Applications" value={policies.length} color="text-yellow-400" />
          <DarkStat label="Approved Today"        value={approved}        color="text-green-400" />
          <DarkStat label="Rejected Today"        value={rejected}        color="text-red-400" />
          <DarkStat label="KYC Pending"           value={kycDocs.length}  color="text-orange-400" />
        </div>

        {/* Policy Applications */}
        <DarkCard title={`📋 Pending Policy Applications (${policies.length})`}>
          {loadingP ? (
            <div className="py-12 text-center text-white/30">Loading…</div>
          ) : policies.length === 0 ? (
            <div className="py-12 text-center text-white/30">No pending applications 🎉</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1a0a2e]">
                    {['Policy #','Customer','Email','Type','Sum Assured','Premium/yr','Applied On','Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {policies.map(p => (
                    <tr key={p.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                      <td className="px-5 py-4 text-xs font-mono-dm text-white/60">{p.policy_number}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{p.full_name}</td>
                      <td className="px-5 py-4 text-xs text-white/40">{p.email}</td>
                      <td className="px-5 py-4 text-sm text-white/70 capitalize">
                        {{'life':'🌿','health':'❤️','vehicle':'🚗'}[p.type]} {p.type}
                      </td>
                      <td className="px-5 py-4 text-sm font-mono-dm text-white/70">₹{Number(p.sum_assured).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-sm font-mono-dm text-white/70">₹{Number(p.total_premium).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-xs text-white/40">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-4">
                        {actingP[p.id] ? (
                          <span className={`text-xs font-bold ${actingP[p.id]==='approve'?'text-green-400':'text-red-400'}`}>
                            {actingP[p.id]==='approve'?'✅ Approved':'❌ Rejected'}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => decidePolicy(p.id, 'approve', p.policy_number)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors">✓ Approve</button>
                            <button onClick={() => decidePolicy(p.id, 'reject', p.policy_number)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors">✗ Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DarkCard>

        {/* KYC Queue */}
        <DarkCard title={`🪪 KYC Document Queue (${kycDocs.length})`}>
          {loadingK ? (
            <div className="py-12 text-center text-white/30">Loading…</div>
          ) : kycDocs.length === 0 ? (
            <div className="py-12 text-center text-white/30">No pending KYC documents 🎉</div>
          ) : (
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
                  {kycDocs.map(doc => (
                    <tr key={doc.id} className="border-b border-[#2d1b4e] hover:bg-white/[0.02]">
                      <td className="px-5 py-4 text-sm font-semibold">{doc.full_name}</td>
                      <td className="px-5 py-4 text-xs text-white/40">{doc.email}</td>
                      <td className="px-5 py-4 text-sm text-white/70 capitalize">{doc.doc_type?.replace(/_/g,' ')}</td>
                      <td className="px-5 py-4 text-xs text-white/40">{new Date(doc.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-4">
                        {actingK[doc.id] ? (
                          <span className={`text-xs font-bold ${actingK[doc.id]==='verify'?'text-green-400':'text-red-400'}`}>
                            {actingK[doc.id]==='verify'?'✅ Verified':'❌ Rejected'}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => decideKYC(doc.id, 'verify', doc.full_name)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors">Verify</button>
                            <button onClick={() => decideKYC(doc.id, 'reject', doc.full_name)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DarkCard>
      </div>
    </div>
  )
}
