import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRODUCTS } from '../data/mockData'
import { SectionHeader, BtnBrand } from '../components/ui'
import PurchaseModal from '../components/PurchaseModal'

// ── Animated hero policy card ─────────────────────────────
function HeroCard() {
  return (
    <div className="bg-white/[0.07] backdrop-blur-md border border-white/[0.12] rounded-2xl p-7 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/20 blur-2xl pointer-events-none" />

      <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1 text-xs font-bold text-green-300 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
        Policy Active
      </div>

      <div className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">Policy Number</div>
      <div className="font-mono-dm text-white text-base mb-4">SHX-LI-2024-00847</div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ['Sum Assured',   '₹50 Lakhs', 'text-white'],
          ['Annual Premium','₹18,400',   'text-accent font-bold'],
          ['Issued On',     'Jan 12, 2024', 'text-white'],
          ['Valid Until',   'Jan 12, 2044', 'text-white'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-white/[0.06] rounded-xl p-3.5">
            <div className="text-white/45 text-[10px] uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-sm font-semibold ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="text-white/50 text-xs">Next Renewal</div>
        <div className="text-white text-sm font-semibold">Jan 12, 2025 — <span className="text-amber-300">28 days</span></div>
      </div>
    </div>
  )
}

// ── Product card ──────────────────────────────────────────
function ProductCard({ product, onBuy }) {
  return (
    <div
      className={`bg-white rounded-2xl p-8 border relative overflow-hidden cursor-pointer group
        transition-all duration-200 hover:-translate-y-1 hover:shadow-float
        ${product.featured
          ? 'border-brand ring-1 ring-brand shadow-card'
          : 'border-gray-100 shadow-card'}`}
      onClick={() => onBuy(product)}
    >
      {product.featured && (
        <span className="absolute top-5 right-5 bg-brand text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
          Most Popular
        </span>
      )}

      <div className={`w-14 h-14 ${product.iconBg} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
        {product.icon}
      </div>

      <h3 className="font-display text-xl font-bold mb-2">{product.name}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-5">
        {product.type === 'Life'    && 'Comprehensive term and whole life coverage protecting your family\'s financial future.'}
        {product.type === 'Health'  && 'Cashless hospitalization at 10,000+ network hospitals with family floater plans.'}
        {product.type === 'Vehicle' && 'Comprehensive and third-party liability coverage for cars, bikes, and commercial vehicles.'}
      </p>

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-xs text-gray-400">from</span>
        <span className="font-display text-3xl font-bold text-brand">{product.from}</span>
        <span className="text-xs text-gray-400">/month</span>
      </div>

      <ul className="mb-7 space-y-2.5">
        {product.features.map(f => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-gray-500">
            <span className="w-5 h-5 rounded-full bg-brand-pale flex items-center justify-center text-brand text-[10px]">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button className="w-full bg-brand group-hover:bg-brand-light text-white font-semibold py-3 rounded-xl transition-colors duration-150">
        Get Quote →
      </button>
    </div>
  )
}

// ── Features strip ────────────────────────────────────────
const FEATURES = [
  { icon: '⚡', title: 'Instant Issuance', desc: 'PDF policy certificate generated in under 2 minutes after payment.' },
  { icon: '🔒', title: 'Bank-Grade Security', desc: 'AES-256 encryption on all PII with full audit trail compliance.' },
  { icon: '📱', title: 'Digital-First Claims', desc: 'File claims and upload evidence directly from your phone.' },
  { icon: '🔔', title: 'Smart Reminders', desc: 'Auto email/SMS reminders 30 days before policy renewal.' },
]

// ── Page ──────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null) // { product }

  return (
    <>
      {/* HERO */}
      <section className="bg-brand min-h-[520px] flex items-center relative overflow-hidden py-16 px-6">
        {/* bg layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(232,160,32,0.15),transparent_60%),radial-gradient(ellipse_at_20%_80%,rgba(26,122,86,0.25),transparent_50%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-full px-4 py-1.5 text-xs font-bold text-accent uppercase tracking-widest mb-6">
              🛡️ &nbsp;Trusted by 2M+ policyholders
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-black text-white leading-[1.08] tracking-tight mb-5">
              Insurance <em className="not-italic text-accent">reimagined</em><br/>for the digital age
            </h1>

            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
              Purchase, manage, and claim your policies entirely online — with instant PDF certificates, real-time tracking, and transparent processing.
            </p>

            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => navigate('/calculator')}
                className="bg-accent hover:bg-accent-dark text-brand-dark font-bold px-7 py-3.5 rounded-xl transition-all duration-150 hover:-translate-y-px shadow-glow"
              >
                Calculate Premium
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="border border-white/30 text-white hover:bg-white/10 font-medium px-7 py-3.5 rounded-xl transition-colors duration-150"
              >
                View Dashboard
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
              {[['₹4.2Cr','Premiums Collected'],['98.2%','Claim Settlement'],['2 hrs','Avg Issuance Time']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-display text-2xl font-bold text-white">{n}</div>
                  <div className="text-white/45 text-[11px] uppercase tracking-widest mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — card visual */}
          <div className="hidden lg:block">
            <HeroCard />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          eyebrow="Our Plans"
          title="Choose your coverage"
          sub="Compare benefits across our three core insurance products. All plans include instant policy issuance and a dedicated claims adjuster."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p} onBuy={setModal} />
          ))}
        </div>

        {/* Features strip */}
        <div className="mt-20 pt-16 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8">
          {FEATURES.map(f => (
            <div key={f.title} className="text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-gray-900 mb-1.5">{f.title}</div>
              <div className="text-sm text-gray-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {modal && (
        <PurchaseModal
          onClose={() => setModal(null)}
          productType={`${modal.name}`}
        />
      )}
    </>
  )
}
