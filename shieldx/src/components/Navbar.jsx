import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import PurchaseModal from './PurchaseModal'
import LoginModal from './LoginModal'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [showLogin,    setShowLogin]    = useState(false)

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <>
      <nav className="bg-brand sticky top-0 z-50 shadow-[0_4px_24px_rgba(15,76,53,0.35)]">
        <div className="px-6 h-16 flex items-center justify-between max-w-screen-2xl mx-auto">
          <NavLink to="/" className="font-display text-2xl font-black text-white tracking-tight">
            Shield<span className="text-accent">X</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/"           className={linkClass}>Products</NavLink>
            <NavLink to="/calculator" className={linkClass}>Calculator</NavLink>
            <NavLink to="/dashboard"  className={linkClass}>Dashboard</NavLink>
            <NavLink to="/admin"      className={linkClass}>Admin</NavLink>
            <button onClick={() => setShowLogin(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={() => setShowPurchase(true)}
              className="ml-2 px-4 py-2 rounded-lg bg-accent text-brand-dark text-sm font-semibold hover:bg-accent-dark transition-colors shadow-glow">
              Get Covered
            </button>
          </div>

          <button className="md:hidden text-white p-1" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-brand-dark border-t border-white/10 px-4 pb-4 flex flex-col gap-1">
            {[['/', 'Products'], ['/calculator', 'Calculator'], ['/dashboard', 'Dashboard'], ['/admin', 'Admin']].map(([to, label]) => (
              <NavLink key={to} to={to} className={linkClass} onClick={() => setMobileOpen(false)}>{label}</NavLink>
            ))}
            <button onClick={() => { setShowPurchase(true); setMobileOpen(false) }}
              className="mt-2 w-full py-2 rounded-lg bg-accent text-brand-dark text-sm font-semibold">
              Get Covered
            </button>
          </div>
        )}
      </nav>

      {showPurchase && <PurchaseModal onClose={() => setShowPurchase(false)} />}
      {showLogin    && <LoginModal    onClose={() => setShowLogin(false)} />}
    </>
  )
}