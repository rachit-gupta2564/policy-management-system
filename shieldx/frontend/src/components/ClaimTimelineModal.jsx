import React from 'react'
import { Modal, Badge, BtnBrand } from './ui'

export default function ClaimTimelineModal({ claim, onClose }) {
  if (!claim) return null
  return (
    <Modal
      title={`Claim Timeline — ${claim.id}`}
      onClose={onClose}
      footer={<BtnBrand onClick={onClose}>Close</BtnBrand>}
    >
      {/* Summary */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">{claim.type} Insurance</div>
          <div className="font-semibold text-gray-900">{claim.description}</div>
          <div className="text-sm text-gray-500 mt-0.5">{claim.amount} claimed</div>
        </div>
        <div className="ml-auto"><Badge status={claim.status} /></div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-[10px] top-0 bottom-0 w-0.5 bg-gray-100" />
        {claim.timeline.map((item, i) => (
          <div key={i} className="relative mb-5 last:mb-0">
            <div className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 top-1
              ${item.disburse  ? 'bg-purple-500 border-purple-500' :
                item.current   ? 'bg-accent border-accent' :
                item.done      ? 'bg-brand border-brand' :
                                 'bg-white border-gray-200'}`}
            />
            <div className="text-xs text-gray-400 mb-0.5">{item.date}</div>
            <div className="text-sm font-semibold text-gray-900">{item.event}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
