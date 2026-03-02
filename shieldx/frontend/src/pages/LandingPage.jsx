import React, { useState } from 'react'
import LoginModal from '../components/LoginModal'

const FEATURES = [
  { icon: '⚡', title: 'Instant Issuance',    desc: 'PDF policy certificate in under 2 minutes after payment.' },
  { icon: '🔒', title: 'Bank-Grade Security', desc: 'AES-256 encryption on all PII with full audit trail.' },
  { icon: '📱', title: 'Digital-First Claims',desc: 'File claims and upload evidence from your phone.' },
  { icon: '🔔', title: 'Smart Reminders',     desc: 'Auto email reminders 30 days before renewal.' },
]

const PRODUCTS = [
  { icon: '🌿', name: 'Life Insurance',    from: '₹850', desc: 'Term & whole life coverage, sum assured up to ₹5 Cr. Tax benefits under 80C.' },
  { icon: '❤️', name: 'Health Insurance',  from: '₹650', desc: 'Cashless hospitalization at 10,000+ hospitals. Family floater plans available.', popular: true },
  { icon: '🚗', name: 'Vehicle Insurance', from: '₹420', desc: 'Comprehensive & third-party. Zero depreciation add-on. NCB up to 50%.' },
]

export default function LandingPage() {
  const [showAuth, setShowAuth]         = useState(false)
  const [authTab,  setAuthTab]          = useState('login')

  const openLogin  = () => { setAuthTab('login');  setShowAuth(true) }
  const openSignup = () => { setAuthTab('signup'); setShowAuth(true) }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="bg-brand min-h-[540px] flex items-center relative overflow-hidden py-16 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(232,160,32,0.15),transparent_60%),radial-gradient(ellipse_at_20%_80%,rgba(26,122,86,0.25),transparent_50%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-full px-4 py-1.5 text-xs font-bold text-accent uppercase tracking-widest mb-6">
              🛡️&nbsp;&nbsp;Trusted by 2M+ policyholders
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white leading-[1.08] tracking-tight mb-5">
              Insurance <em className="not-italic text-accent">reimagined</em><br/>for the digital age
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
              Purchase, manage, and claim policies entirely online — instant PDF certificates, real-time tracking, transparent processing.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={openSignup}
                className="bg-accent hover:bg-accent-dark text-brand-dark font-bold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-px shadow-glow">
                Create Free Account →
              </button>
              <button onClick={openLogin}
                className="border border-white/30 text-white hover:bg-white/10 font-medium px-7 py-3.5 rounded-xl transition-colors">
                Sign In
              </button>
            </div>
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
              {[['₹4.2Cr','Premiums Collected'],['98.2%','Claim Settlement'],['2 hrs','Avg Issuance Time']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-display text-2xl font-bold text-white">{n}</div>
                  <div className="text-white/45 text-[11px] uppercase tracking-widest mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — sign-in card */}
          <div className="hidden lg:block">
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/[0.12] rounded-2xl p-8">
              <div className="text-white font-display text-xl font-bold mb-1">Get started in minutes</div>
              <p className="text-white/50 text-sm mb-6">Create an account or sign in to manage your policies.</p>

              <button onClick={openSignup}
                className="w-full bg-accent hover:bg-accent-dark text-brand-dark font-bold py-3.5 rounded-xl transition-colors mb-3">
                Create Account — It's Free
              </button>
              <button onClick={openLogin}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 rounded-xl transition-colors">
                Sign In to Existing Account
              </button>

              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
                {[['🌿','Life'],['❤️','Health'],['🚗','Vehicle']].map(([icon, label]) => (
                  <div key={label} className="bg-white/[0.06] rounded-xl py-3">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-white/60 text-xs">{label}</div>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-xs text-center mt-4">
                🔒 AES-256 encrypted · IRDAI Reg. No. 147
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Our Plans</div>
          <h2 className="font-display text-3xl font-black text-gray-900 mb-3">Choose your coverage</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Sign in or create an account to get a quote, purchase a policy, and manage everything online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PRODUCTS.map(p => (
            <div key={p.name}
              className={`bg-white rounded-2xl p-8 border shadow-card relative ${p.popular ? 'border-brand ring-1 ring-brand' : 'border-gray-100'}`}>
              {p.popular && (
                <span className="absolute top-5 right-5 bg-brand text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-display text-xl font-bold mb-2">{p.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-xs text-gray-400">from</span>
                <span className="font-display text-3xl font-bold text-brand">{p.from}</span>
                <span className="text-xs text-gray-400">/month</span>
              </div>
              <button onClick={openSignup}
                className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-xl transition-colors">
                Get Quote →
              </button>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="pt-16 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8">
          {FEATURES.map(f => (
            <div key={f.title} className="text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-gray-900 mb-1.5">{f.title}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-brand py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl font-black text-white mb-4">Ready to get protected?</h2>
          <p className="text-white/60 mb-8">Join over 2 million policyholders. Get covered in minutes.</p>
          <button onClick={openSignup}
            className="bg-accent hover:bg-accent-dark text-brand-dark font-bold px-10 py-4 rounded-xl transition-all hover:-translate-y-px shadow-glow text-lg">
            Create Your Free Account →
          </button>
        </div>
      </section>

      {showAuth && (
        <LoginModal onClose={() => setShowAuth(false)} defaultTab={authTab} />
      )}
    </>
  )
}
