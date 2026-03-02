import React from 'react'
import { STATUS_STYLES } from '../data/mockData'

// ── Badge ──────────────────────────────────────────────────
export function Badge({ status }) {
  const base = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${base}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
      {status}
    </span>
  )
}

// ── Modal shell ────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.25)] w-full max-h-[90vh] overflow-y-auto animate-modal-in ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface text-gray-400 hover:bg-gray-200 flex items-center justify-center text-lg transition-colors">✕</button>
        </div>
        <div className="px-7 py-6">{children}</div>
        {footer && (
          <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ── FormGroup ──────────────────────────────────────────────
export function FormGroup({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// ── Input ──────────────────────────────────────────────────
export function Input(props) {
  return (
    <input
      {...props}
      className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-gray-900 bg-white outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  )
}

// ── Select ─────────────────────────────────────────────────
export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-gray-900 bg-white outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/10"
    >
      {children}
    </select>
  )
}

// ── Textarea ───────────────────────────────────────────────
export function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-gray-900 bg-white outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/10 min-h-[100px] resize-y"
    />
  )
}

// ── Buttons ────────────────────────────────────────────────
export function BtnPrimary({ children, onClick, className = '', type = 'button' }) {
  return (
    <button type={type} onClick={onClick}
      className={`bg-accent hover:bg-accent-dark text-brand-dark font-semibold py-3 px-6 rounded-xl transition-all duration-150 hover:-translate-y-px active:translate-y-0 shadow-glow ${className}`}
    >{children}</button>
  )
}

export function BtnBrand({ children, onClick, className = '', type = 'button' }) {
  return (
    <button type={type} onClick={onClick}
      className={`bg-brand hover:bg-brand-light text-white font-semibold py-3 px-6 rounded-xl transition-all duration-150 hover:-translate-y-px active:translate-y-0 ${className}`}
    >{children}</button>
  )
}

export function BtnGhost({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick}
      className={`bg-surface border border-gray-200 text-gray-500 font-medium py-2.5 px-5 rounded-xl hover:bg-gray-100 transition-colors duration-150 ${className}`}
    >{children}</button>
  )
}

export function BtnSm({ children, onClick, variant = 'blue' }) {
  const variants = {
    blue:   'bg-blue-50  text-blue-700  hover:bg-blue-100',
    green:  'bg-green-50 text-green-700 hover:bg-green-100',
    red:    'bg-red-50   text-red-700   hover:bg-red-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    amber:  'bg-amber-50 text-amber-700 hover:bg-amber-100',
  }
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 ${variants[variant] || variants.blue}`}
    >{children}</button>
  )
}

// ── Card ───────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-card ${className}`}>
      {children}
    </div>
  )
}

// ── Table ──────────────────────────────────────────────────
export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface">
            {headers.map(h => (
              <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TR({ children }) {
  return <tr className="border-b border-gray-50 hover:bg-surface transition-colors">{children}</tr>
}

export function TD({ children, className = '' }) {
  return <td className={`px-6 py-4 text-sm text-gray-800 ${className}`}>{children}</td>
}

// ── Upload Zone ────────────────────────────────────────────
export function UploadZone({ label = 'Click to upload', sub = 'PDF, JPG, PNG (max 5MB)', onClick }) {
  return (
    <div
      onClick={onClick}
      className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-pale transition-colors duration-200"
    >
      <div className="text-3xl mb-3">📎</div>
      <div className="text-sm text-gray-500">
        <strong className="text-brand">{label}</strong> or drag and drop
      </div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────
export function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div className="mb-10">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-light mb-2">{eyebrow}</div>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight leading-tight">{title}</h2>
      {sub && <p className="text-gray-500 mt-3 text-base leading-relaxed max-w-xl">{sub}</p>}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────
export function StatCard({ label, value, change, changeType = 'neutral' }) {
  const changeColor = changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-500' : 'text-gray-400'
  return (
    <Card className="p-5">
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{label}</div>
      <div className="font-display text-2xl font-bold leading-none">{value}</div>
      {change && <div className={`text-xs mt-1.5 ${changeColor}`}>{change}</div>}
    </Card>
  )
}
