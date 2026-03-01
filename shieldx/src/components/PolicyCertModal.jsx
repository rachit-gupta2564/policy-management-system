import React from 'react'
import { Modal, BtnBrand, BtnGhost } from './ui'
import { useToast } from '../App'

export default function PolicyCertModal({ policy, onClose }) {
  const toast = useToast()
  if (!policy) return null
  const headerBg = policy.type === 'Health' ? 'bg-blue-700' : policy.type === 'Vehicle' ? 'bg-amber-700' : 'bg-brand'

  return (
    <Modal title="Policy Certificate" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Close</BtnGhost><BtnBrand onClick={() => { toast('Certificate downloaded as PDF ✓','success'); onClose() }}>⬇ Download PDF</BtnBrand></>}
    >
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className={`${headerBg} px-6 py-5 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">🛡️</div>
          <div className="flex-1">
            <div className="font-display text-lg font-black text-white">ShieldX</div>
            <div className="text-white/60 text-[10px] uppercase tracking-widest">Insurance Policy Certificate</div>
          </div>
          <div className="font-mono-dm text-white/70 text-xs">QR: {policy.id.slice(-8)}</div>
        </div>
        <div className="p-6 divide-y divide-gray-50">
          {[
            ['Policy Number', policy.id],
            ['Policyholder',  'Arjun Mehta'],
            ['Type',          `${policy.type} Insurance`],
            ['Sum Assured',   policy.sumAssured],
            ['Annual Premium',policy.premium],
            ['Issued On',     policy.issued],
            ['Valid Until',   policy.expiry],
            ...(policy.nominee ? [['Nominee', policy.nominee]] : []),
            ...(policy.members ? [['Members', policy.members]] : []),
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between py-2.5">
              <span className="text-sm text-gray-400">{key}</span>
              <span className="text-sm font-mono-dm font-medium">{val}</span>
            </div>
          ))}
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-gray-400">Status</span>
            <span className="text-sm font-mono-dm font-semibold text-green-600">● ACTIVE</span>
          </div>
        </div>
        <div className="px-6 py-3 bg-surface text-[11px] text-gray-400 border-t border-gray-100">
          Digitally issued by ShieldX Insurance Ltd. (IRDAI Reg. No. 147).
        </div>
      </div>
    </Modal>
  )
}