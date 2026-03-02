import React from 'react'
import { Modal, BtnBrand, BtnGhost } from './ui'
import { useAuth } from '../context/AuthContext'
import { policiesAPI } from '../services/api'

const TYPE_BG = { life: 'bg-brand', health: 'bg-blue-700', vehicle: 'bg-amber-700' }
const TYPE_ICON = { life: '🌿', health: '❤️', vehicle: '🚗' }

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtMoney(n) { return `₹${Number(n).toLocaleString('en-IN')}` }

export default function PolicyCertModal({ policy, onClose }) {
  const { user } = useAuth()
  if (!policy) return null

  const bg   = TYPE_BG[policy.type]   || 'bg-brand'
  const icon = TYPE_ICON[policy.type] || '📋'

  const download = () => {
    const url = policiesAPI.certUrl(policy.id)
    window.open(url, '_blank')
  }

  const rows = [
    ['Policy Number',  policy.policy_number || policy.id],
    ['Policyholder',   user?.full_name || '—'],
    ['Type',           `${policy.type ? policy.type.charAt(0).toUpperCase() + policy.type.slice(1) : ''} Insurance`],
    ['Sum Assured',    fmtMoney(policy.sum_assured)],
    ['Annual Premium', fmtMoney(policy.total_premium)],
    ['Start Date',     fmt(policy.start_date)],
    ['Valid Until',    fmt(policy.end_date)],
    ['Status',         'ACTIVE'],
  ]

  return (
    <Modal title="Policy Certificate" onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Close</BtnGhost>
          <BtnBrand onClick={download}>⬇ Download PDF</BtnBrand>
        </>
      }
    >
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <div className={`${bg} px-6 py-5 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">{icon}</div>
          <div className="flex-1">
            <div className="font-display text-lg font-black text-white">ShieldX</div>
            <div className="text-white/60 text-[10px] uppercase tracking-widest">Insurance Policy Certificate</div>
          </div>
          <div className="text-right">
            <div className="font-mono-dm text-white/70 text-xs">
              {(policy.policy_number || policy.id || '').slice(-8)}
            </div>
            <div className="text-white/40 text-[10px]">Policy Ref</div>
          </div>
        </div>

        {/* Fields */}
        <div className="p-6 divide-y divide-gray-50">
          {rows.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-400">{key}</span>
              {key === 'Status' ? (
                <span className="text-sm font-mono-dm font-semibold text-green-600">● {val}</span>
              ) : (
                <span className="text-sm font-mono-dm font-medium text-gray-800">{val}</span>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-surface text-[11px] text-gray-400 border-t border-gray-100">
          Digitally issued by ShieldX Insurance Ltd. (IRDAI Reg. No. 147). Valid as proof of insurance.
        </div>
      </div>
    </Modal>
  )
}

