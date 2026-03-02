import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, FormGroup, Input, BtnBrand, BtnGhost } from './ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../App'

// Where to send each role after login
const ROLE_HOME = {
  admin:       '/admin',
  underwriter: '/underwriter',
  adjuster:    '/adjuster',
  customer:    '/dashboard',
}

function TabBar({ active, onChange }) {
  return (
    <div className="flex bg-surface rounded-xl p-1 mb-6">
      {[['login','Sign In'], ['signup','Create Account']].map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
            active === id ? 'bg-white shadow text-brand' : 'text-gray-400 hover:text-gray-700'
          }`}>
          {label}
        </button>
      ))}
    </div>
  )
}

export default function LoginModal({ onClose, defaultTab = 'login' }) {
  const toast    = useToast()
  const navigate = useNavigate()
  const { login, register, loading } = useAuth()

  const [tab,   setTab]   = useState(defaultTab)
  const [error, setError] = useState('')

  const [lf, setLF] = useState({ email: '', password: '' })
  const [sf, setSF] = useState({ full_name: '', email: '', password: '', confirm: '', phone: '' })

  const sl = k => e => setLF(p => ({ ...p, [k]: e.target.value }))
  const ss = k => e => setSF(p => ({ ...p, [k]: e.target.value }))

  const switchTab = t => { setTab(t); setError('') }

  // ── Login ────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('')
    if (!lf.email || !lf.password) { setError('Please fill in all fields'); return }
    try {
      const user = await login(lf.email, lf.password)
      const first = user.full_name.split(' ')[0]
      toast(`Welcome back, ${first}! ✓`, 'success')
      onClose()
      navigate(ROLE_HOME[user.role] || '/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Signup ───────────────────────────────────────────────
  const handleSignup = async () => {
    setError('')
    if (!sf.full_name || !sf.email || !sf.password) { setError('Please fill in all required fields'); return }
    if (sf.password !== sf.confirm)                  { setError('Passwords do not match'); return }
    if (sf.password.length < 8)                      { setError('Password must be at least 8 characters'); return }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(sf.password)) {
      setError('Password must have uppercase, lowercase and a number'); return
    }
    try {
      const user = await register({
        full_name: sf.full_name,
        email:     sf.email,
        password:  sf.password,
        phone:     sf.phone || undefined,
      })
      toast(`Welcome to ShieldX, ${user.full_name.split(' ')[0]}! 🎉`, 'success')
      onClose()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const onEnter = fn => e => e.key === 'Enter' && fn()

  return (
    <Modal
      title={tab === 'login' ? 'Sign In to ShieldX' : 'Create your account'}
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnBrand onClick={tab === 'login' ? handleLogin : handleSignup} className="min-w-[140px]">
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </BtnBrand>
        </>
      }
    >
      <TabBar active={tab} onChange={switchTab} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          ⚠ {error}
        </div>
      )}

      {/* ── LOGIN ─────────────────────────────────────────── */}
      {tab === 'login' && (
        <>
          <FormGroup label="Email Address">
            <Input type="email" placeholder="you@example.com"
              value={lf.email} onChange={sl('email')} onKeyDown={onEnter(handleLogin)} />
          </FormGroup>
          <FormGroup label="Password">
            <Input type="password" placeholder="••••••••"
              value={lf.password} onChange={sl('password')} onKeyDown={onEnter(handleLogin)} />
          </FormGroup>
          <div className="flex justify-end mt-1 mb-5">
            <span className="text-sm text-brand font-medium cursor-pointer hover:underline">Forgot password?</span>
          </div>

          {/* Demo account quick-fill */}
          <div className="bg-surface border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">🧪 Demo accounts (click to fill)</div>
            <div className="space-y-1">
              {[
                ['Admin',       'admin@shieldx.in'],
                ['Underwriter', 'underwriter@shieldx.in'],
                ['Adjuster',    'adjuster@shieldx.in'],
              ].map(([role, email]) => (
                <button key={role}
                  onClick={() => setLF({ email, password: 'Admin@123' })}
                  className="block text-left w-full text-xs hover:text-brand text-gray-400 transition-colors py-0.5 font-mono-dm">
                  {role}: {email}
                </button>
              ))}
              <p className="text-xs text-gray-300 mt-1">Password: Admin@123</p>
            </div>
          </div>
        </>
      )}

      {/* ── SIGNUP ────────────────────────────────────────── */}
      {tab === 'signup' && (
        <>
          <FormGroup label="Full Name *">
            <Input placeholder="Arjun Mehta"
              value={sf.full_name} onChange={ss('full_name')} />
          </FormGroup>
          <FormGroup label="Email Address *">
            <Input type="email" placeholder="arjun@example.com"
              value={sf.email} onChange={ss('email')} />
          </FormGroup>
          <FormGroup label="Phone (optional)">
            <Input type="tel" placeholder="9876543210"
              value={sf.phone} onChange={ss('phone')} />
          </FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Password *">
              <Input type="password" placeholder="Min 8 chars"
                value={sf.password} onChange={ss('password')} />
            </FormGroup>
            <FormGroup label="Confirm Password *">
              <Input type="password" placeholder="Repeat"
                value={sf.confirm} onChange={ss('confirm')} onKeyDown={onEnter(handleSignup)} />
            </FormGroup>
          </div>
          <p className="text-xs text-gray-400 mt-1">Must include uppercase, lowercase and a number.</p>
        </>
      )}

      <p className="text-xs text-gray-400 mt-4">🔒 AES-256 encrypted. Your data is never sold.</p>
    </Modal>
  )
}
