import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User } from 'lucide-react'
import LoginModal from './LoginModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../App'

const NAV_LINKS = {
  customer:    [['/', 'Products'], ['/calculator', 'Calculator'], ['/dashboard', 'Dashboard']],
  admin:       [['/admin', 'Admin Panel']],
  underwriter: [['/underwriter', 'Policy Review']],
  adjuster:    [['/adjuster', 'Claims Queue']],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [showAuth,     setShowAuth]     = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const links = user ? (NAV_LINKS[user.role] || []) : []

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    setMobileOpen(false)
    navigate('/')
    toast('You have been signed out.', 'info')
  }

  const avatar = user?.full_name?.charAt(0).toUpperCase() || '?'

  return (
    <>
      <nav className="bg-brand sticky top-0 z-50 shadow-[0_4px_24px_rgba(15,76,53,0.35)]">
        <div className="px-6 h-16 flex items-center justify-between max-w-screen-2xl mx-auto">

          {/* Logo */}
          <NavLink to="/" className="font-display text-2xl font-black text-white tracking-tight">
            Shield<span className="text-accent">X</span>
          </NavLink>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>{label}</NavLink>
            ))}

            {!user ? (
              /* Not logged in: only Sign In + Create Account */
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => setShowAuth(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors border border-white/20">
                  Sign In
                </button>
                <button onClick={() => { setShowAuth(true) }}
                  className="px-4 py-2 rounded-lg bg-accent text-brand-dark text-sm font-semibold hover:bg-accent-dark transition-colors shadow-glow">
                  Create Account
                </button>
              </div>
            ) : (
              /* Logged in: avatar + dropdown */
              <div className="relative ml-3">
                <button onClick={() => setShowUserMenu(o => !o)}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-accent text-brand-dark flex items-center justify-center text-sm font-bold">
                    {avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold leading-none">{user.full_name.split(' ')[0]}</div>
                    <div className="text-white/50 text-[10px] capitalize mt-0.5">{user.role}</div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-float border border-gray-100 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                      <div className="text-xs text-gray-400 truncate">{user.email}</div>
                      <div className="text-[10px] text-brand font-semibold uppercase tracking-wide mt-0.5">{user.role}</div>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-white p-1" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-brand-dark border-t border-white/10 px-4 pb-4 flex flex-col gap-1">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass} onClick={() => setMobileOpen(false)}>
                {label}
              </NavLink>
            ))}
            {!user ? (
              <button onClick={() => { setShowAuth(true); setMobileOpen(false) }}
                className="mt-2 w-full py-2.5 rounded-lg bg-accent text-brand-dark text-sm font-semibold">
                Sign In / Create Account
              </button>
            ) : (
              <button onClick={handleLogout}
                className="mt-2 w-full py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium">
                Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}
      {showAuth && <LoginModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
