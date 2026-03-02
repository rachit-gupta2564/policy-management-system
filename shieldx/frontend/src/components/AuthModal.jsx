import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, FormGroup, Input, BtnBrand, BtnGhost } from './ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../App'

// ── Tab toggle ────────────────────────────────────────────
function Tabs({ active, onChange }) {
  return (
    <div className="flex bg-surface rounded-xl p-1 mb-6">
      {['login', 'signup'].map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-150 ${
            active === t
              ? 'bg-white shadow text-brand'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          {t === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      ))}
    </div>
  )
}

// ── Role redirect map ─────────────────────────────────────
const ROLE_REDIRECT = {
  admin:       '/admin',
  underwriter: '/underwriter',
  adjuster:    '/adjuster',
  customer:    '/dashboard',
}

export default function AuthModal({ onClose, defaultTab = 'login' }) {
  const toast    = useToast()
  const navigate = useNavigate()
  const { login, register, loading } = useAuth()

  const [tab, setTab] = useState(defaultTab)

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Signup form
  const [signupForm, setSignupForm] = useState({
    full_name: '', email: '', password: '', confirm: '', phone: '',
  })

  const [error, setError] = useState('')

  const setLogin  = k => e => setLoginForm(p  => ({ ...p,  [k]: e.target.value }))
  const setSignup = k => e => setSignupForm(p => ({ ...p, [k]: e.target.value }))

  // ── Handle Login ────────────────────────────────────────
  const handleLogin = async () => {
    setError('')
    if (!loginForm.email || !loginForm.password) {
      setError('Please fill in all fields')
      return
    }
    try {
      const user = await login(loginForm.email, loginForm.password)
      toast(`Welcome back, ${user.full_name.split(' ')[0]}! ✓`, 'success')
      onClose()
      navigate(ROLE_REDIRECT[user.role] || '/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Handle Signup ───────────────────────────────────────
  const handleSignup = async () => {
    setError('')
    if (!signupForm.full_name || !signupForm.email || !signupForm.password) {
      setError('Please fill in all required fields')
      return
    }
    if (signupForm.password !== signupForm.confirm) {
      setError('Passwords do not match')
      return
    }
    if (signupForm.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupForm.password)) {
      setError('Password must contain uppercase, lowercase, and a number')
      return
    }
    try {
      const user = await register({
        full_name: signupForm.full_name,
        email:     signupForm.email,
        password:  signupForm.password,
        phone:     signupForm.phone || undefined,
      })
      toast(`Account created! Welcome, ${user.full_name.split(' ')[0]}! 🎉`, 'success')
      onClose()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal
      title={tab === 'login' ? 'Sign In to ShieldX' : 'Create your account'}
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnBrand
            onClick={tab === 'login' ? handleLogin : handleSignup}
            className="min-w-[120px]"
          >
            {loading
              ? 'Please wait…'
              : tab === 'login' ? 'Sign In →' : 'Create Account →'
            }
          </BtnBrand>
        </>
      }
    >
      <Tabs active={tab} onChange={(t) => { setTab(t); setError('') }} />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          ⚠ {error}
        </div>
      )}

      {/* ── LOGIN FORM ─────────────────────────────────── */}
      {tab === 'login' && (
        <>
          <FormGroup label="Email Address">
            <Input
              type="email"
              placeholder="you@example.com"
              value={loginForm.email}
              onChange={setLogin('email')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </FormGroup>
          <FormGroup label="Password">
            <Input
              type="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={setLogin('password')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </FormGroup>
          <div className="flex justify-end mt-1 mb-4">
            <span className="text-sm text-brand font-medium cursor-pointer hover:underline">
              Forgot password?
            </span>
          </div>

          {/* Quick-fill hints for demo */}
          <div className="bg-surface border border-gray-100 rounded-xl p-4 text-xs text-gray-500">
            <div className="font-semibold text-gray-700 mb-2">🧪 Demo accounts</div>
            {[
              ['Admin',       'admin@shieldx.in'],
              ['Underwriter', 'underwriter@shieldx.in'],
              ['Adjuster',    'adjuster@shieldx.in'],
            ].map(([role, email]) => (
              <button
                key={role}
                onClick={() => setLoginForm({ email, password: 'Admin@123' })}
                className="block text-left w-full hover:text-brand transition-colors py-0.5"
              >
                {role}: <span className="font-mono-dm">{email}</span>
              </button>
            ))}
            <p className="text-gray-400 mt-1">Password for all: <span className="font-mono-dm">Admin@123</span></p>
          </div>
        </>
      )}

      {/* ── SIGNUP FORM ────────────────────────────────── */}
      {tab === 'signup' && (
        <>
          <FormGroup label="Full Name *">
            <Input
              placeholder="Arjun Mehta"
              value={signupForm.full_name}
              onChange={setSignup('full_name')}
            />
          </FormGroup>
          <FormGroup label="Email Address *">
            <Input
              type="email"
              placeholder="arjun@example.com"
              value={signupForm.email}
              onChange={setSignup('email')}
            />
          </FormGroup>
          <FormGroup label="Phone (optional)">
            <Input
              type="tel"
              placeholder="9876543210"
              value={signupForm.phone}
              onChange={setSignup('phone')}
            />
          </FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Password *">
              <Input
                type="password"
                placeholder="Min 8 chars"
                value={signupForm.password}
                onChange={setSignup('password')}
              />
            </FormGroup>
            <FormGroup label="Confirm Password *">
              <Input
                type="password"
                placeholder="Repeat password"
                value={signupForm.confirm}
                onChange={setSignup('confirm')}
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
              />
            </FormGroup>
          </div>
          <p className="text-xs text-gray-400 mt-1 mb-2">
            Must contain uppercase, lowercase, and a number.
          </p>
        </>
      )}

      <p className="text-xs text-gray-400 mt-4">
        🔒 All sessions are encrypted with AES-256 standard.
      </p>
    </Modal>
  )
}
