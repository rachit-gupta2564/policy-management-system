import React, { useEffect, useState } from 'react'
import { Modal, Badge, BtnBrand } from './ui'
import { claimsAPI } from '../services/api'

function fmt(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_MAP = {
  submitted:    { label: 'Pending',      color: 'text-yellow-600' },
  under_review: { label: 'Under Review', color: 'text-blue-600'   },
  approved:     { label: 'Approved',     color: 'text-green-600'  },
  disbursed:    { label: 'Disbursed',    color: 'text-purple-600' },
  rejected:     { label: 'Rejected',     color: 'text-red-600'    },
}

// Convert DB history rows into timeline steps
function buildTimeline(history = [], claim) {
  if (!history.length) {
    return [{
      date:   fmt(claim.created_at),
      event:  'Claim Submitted',
      detail: claim.description,
      done:   true,
      current: claim.status === 'submitted',
    }]
  }
  return history.map((h, i) => ({
    date:    fmt(h.created_at),
    event:   h.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    detail:  h.note || (h.status === 'disbursed' ? `₹${Number(claim.approved_amount || claim.claim_amount).toLocaleString('en-IN')} credited to your account` : ''),
    done:    true,
    current: i === history.length - 1,
    disburse: h.status === 'disbursed',
  }))
}

export default function ClaimTimelineModal({ claim, onClose }) {
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!claim?.id) return
    claimsAPI.get(claim.id)
      .then(d => setDetail(d.claim || d))
      .catch(() => setDetail(claim))
      .finally(() => setLoading(false))
  }, [claim?.id])

  if (!claim) return null

  const c        = detail || claim
  const status   = STATUS_MAP[c.status] || { label: c.status, color: 'text-gray-600' }
  const timeline = buildTimeline(c.history || [], c)
  const typeIcon = { life:'🌿', health:'❤️', vehicle:'🚗' }[c.policy_type] || '📋'

  return (
    <Modal title={`Claim — ${c.claim_number || claim.claim_number}`} onClose={onClose}
      footer={<BtnBrand onClick={onClose}>Close</BtnBrand>}>

      {/* Summary */}
      <div className="flex items-start gap-4 mb-6 pb-5 border-b border-gray-100">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-0.5">{typeIcon} {c.policy_type} Insurance</div>
          <div className="font-semibold text-gray-900">{c.description}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            ₹{Number(c.claim_amount).toLocaleString('en-IN')} claimed
            {c.approved_amount && c.status !== 'rejected' &&
              <span className="text-green-600 ml-2">· ₹{Number(c.approved_amount).toLocaleString('en-IN')} approved</span>
            }
          </div>
        </div>
        <div className={`text-sm font-bold ${status.color}`}>● {status.label}</div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-8 text-gray-300">Loading timeline…</div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[10px] top-0 bottom-0 w-0.5 bg-gray-100" />
          {timeline.map((item, i) => (
            <div key={i} className="relative mb-5 last:mb-0">
              <div className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 top-1
                ${item.disburse  ? 'bg-purple-500 border-purple-500'
                : item.current   ? 'bg-accent border-accent'
                : item.done      ? 'bg-brand border-brand'
                :                  'bg-white border-gray-200'}`}
              />
              <div className="text-xs text-gray-400 mb-0.5">{item.date}</div>
              <div className="text-sm font-semibold text-gray-900">{item.event}</div>
              {item.detail && <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

