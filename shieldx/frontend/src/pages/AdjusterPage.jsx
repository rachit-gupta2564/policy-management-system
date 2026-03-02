import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../App'
import { claimsAPI } from '../services/api'

// Valid next states for each claim status
const NEXT_STATES = {
  submitted:    ['under_review', 'rejected'],
  under_review: ['approved',     'rejected'],
  approved:     ['disbursed'],
  disbursed:    [],
  rejected:     [],
}

const STATUS_STYLE = {
  submitted:    'bg-yellow-900/50 text-yellow-400',
  under_review: 'bg-blue-900/50   text-blue-400',
  approved:     'bg-green-900/50  text-green-400',
  disbursed:    'bg-purple-900/50 text-purple-400',
  rejected:     'bg-red-900/50    text-red-400',
}

const ACTION_STYLE = {
  under_review: ['Review',  'bg-blue-900/40   text-blue-400   hover:bg-blue-900/70'],
  approved:     ['Approve', 'bg-green-900/40  text-green-400  hover:bg-green-900/70'],
  disbursed:    ['Disburse','bg-purple-900/40 text-purple-400 hover:bg-purple-900/70'],
  rejected:     ['Reject',  'bg-red-900/40    text-red-400    hover:bg-red-900/70'],
}

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

export default function AdjusterPage() {
  const { user } = useAuth()
  const toast    = useToast()

  const [claims,  setClaims]  = useState([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState({})
  const [filter,  setFilter]  = useState('all')

  const load = () => {
    setLoading(true)
    claimsAPI.all({ limit: 100 })
      .then(d => setClaims(d.claims || []))
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const advance = async (claimId, newStatus) => {
    setActing(p => ({ ...p, [claimId]: newStatus }))
    try {
      await claimsAPI.updateStatus(claimId, {
        status: newStatus,
        note: `Status updated to ${newStatus} by adjuster ${user?.full_name}`,
        ...(newStatus === 'approved' ? { approved_amount: claims.find(c=>c.id===claimId)?.claim_amount } : {})
      })
      toast({
        under_review: `🔍 Claim moved to Under Review`,
        approved:     `✅ Claim approved`,
        disbursed:    `💸 Payment disbursed to customer`,
        rejected:     `❌ Claim rejected`,
      }[newStatus] || 'Claim updated', newStatus === 'approved' || newStatus === 'disbursed' ? 'success' : 'info')
      // Optimistic update
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: newStatus } : c))
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActing(p => ({ ...p, [claimId]: null }))
    }
  }

  const counts = {
    all:          claims.length,
    submitted:    claims.filter(c => c.status === 'submitted').length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    approved:     claims.filter(c => c.status === 'approved').length,
    disbursed:    claims.filter(c => c.status === 'disbursed').length,
    rejected:     claims.filter(c => c.status === 'rejected').length,
  }

  const visible = filter === 'all' ? claims : claims.filter(c => c.status === filter)

  const typeIcon = t => ({ life:'🌿', health:'❤️', vehicle:'🚗' })[t] || '📋'

  return (
    <div className="min-h-screen bg-[#0d0720] text-white">
      {/* Header */}
      <div className="bg-[#140b2e] border-b border-[#2d1b4e] px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Claims Adjuster Portal</h1>
            <p className="text-white/50 text-sm mt-0.5">
              Welcome, {user?.full_name} — Process and settle insurance claims
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              ↻ Refresh
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <DarkStat label="New"         value={counts.submitted}    color="text-yellow-400" />
          <DarkStat label="Under Review"value={counts.under_review} color="text-blue-400" />
          <DarkStat label="Approved"    value={counts.approved}     color="text-green-400" />
          <DarkStat label="Disbursed"   value={counts.disbursed}    color="text-purple-400" />
          <DarkStat label="Rejected"    value={counts.rejected}     color="text-red-400" />
          <DarkStat label="Total"       value={counts.all} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {['all','submitted','under_review','approved','disbursed','rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}>
              {f.replace(/_/g,' ')} {counts[f] > 0 && <span className="ml-1 opacity-60">({counts[f]})</span>}
            </button>
          ))}
        </div>

        {/* Claims table */}
        <DarkCard title={`📋 Claims Queue — ${filter === 'all' ? 'All' : filter.replace(/_/g,' ')} (${visible.length})`}>
          {loading ? (
            <div className="py-16 text-center text-white/30">Loading claims…</div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center text-white/30">No claims in this category</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1a0a2e]">
                    {['Claim #','Policy','Customer','Type','Claimed Amt','Status','Filed','Next Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-[#2d1b4e]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(claim => {
                    const next = NEXT_STATES[claim.status] || []
                    const busy = !!acting[claim.id]
                    return (
                      <tr key={claim.id} className={`border-b border-[#2d1b4e] ${busy ? 'opacity-60' : 'hover:bg-white/[0.02]'}`}>
                        <td className="px-5 py-4 text-xs font-mono-dm text-white/60">{claim.claim_number}</td>
                        <td className="px-5 py-4 text-xs font-mono-dm text-white/40">{claim.policy_number}</td>
                        <td className="px-5 py-4 text-sm font-semibold">{claim.full_name}</td>
                        <td className="px-5 py-4 text-sm">{typeIcon(claim.policy_type)} {claim.policy_type}</td>
                        <td className="px-5 py-4 text-sm font-mono-dm">₹{Number(claim.claim_amount).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[claim.status]||'bg-white/10 text-white/60'}`}>
                            {claim.status.replace(/_/g,' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-white/40">
                          {new Date(claim.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-5 py-4">
                          {next.length === 0 ? (
                            <span className="text-xs text-white/25">Terminal</span>
                          ) : (
                            <div className="flex gap-1.5 flex-wrap">
                              {next.map(s => {
                                const [label, cls] = ACTION_STYLE[s] || [s, 'bg-white/10 text-white/60']
                                return (
                                  <button key={s}
                                    onClick={() => advance(claim.id, s)}
                                    disabled={busy}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${cls}`}>
                                    {busy && acting[claim.id] === s ? '…' : label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DarkCard>

        {/* Info */}
        <div className="bg-[#140b2e] border border-[#2d1b4e] rounded-xl p-4 text-xs text-white/40">
          <span className="text-white/60 font-semibold">State machine: </span>
          Submitted → Under Review → Approved → Disbursed · Any open state can be Rejected.
          Terminal states (Disbursed, Rejected) are final. NCB is reset automatically when a vehicle claim is approved.
        </div>
      </div>
    </div>
  )
}
