import React from 'react'

const ICONS = { success: '✓', error: '✗', info: 'ℹ' }
const BG    = { success: 'bg-green-800', error: 'bg-red-700', info: 'bg-brand' }

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-toast-in flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-white text-sm font-medium shadow-float max-w-xs ${BG[t.type] || BG.info}`}
        >
          <span className="shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {ICONS[t.type]}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
