// ── Static mock data shared across the app ──────────────────

export const POLICIES = [
  {
    id: 'SHX-LI-2024-00847',
    type: 'Life',
    icon: '🌿',
    coverage: '₹50 Lakhs',
    premium: '₹18,400/yr',
    status: 'Active',
    expiry: 'Jan 12, 2044',
    issued: 'Jan 12, 2024',
    sumAssured: '₹50,00,000',
    nominee: 'Sonal Mehta (Spouse)',
    members: null,
  },
  {
    id: 'SHX-HI-2024-00291',
    type: 'Health',
    icon: '❤️',
    coverage: '₹10 Lakhs',
    premium: '₹15,600/yr',
    status: 'Active',
    expiry: 'Sep 5, 2026',
    issued: 'Sep 5, 2024',
    sumAssured: '₹10,00,000',
    nominee: null,
    members: 'Arjun + Sonal Mehta',
  },
  {
    id: 'SHX-VI-2024-00123',
    type: 'Vehicle',
    icon: '🚗',
    coverage: 'IDV ₹6.5L',
    premium: '₹8,850/yr',
    status: 'Renewal Due',
    expiry: 'Mar 29, 2026',
    issued: 'Mar 29, 2024',
    sumAssured: 'IDV ₹6,50,000',
    nominee: null,
    members: null,
  },
]

export const CLAIMS = [
  {
    id: 'CLM-2025-04821',
    policyId: 'SHX-VI-2024-00123',
    type: 'Vehicle',
    icon: '🚗',
    description: 'Rear-end collision on NH-48',
    amount: '₹34,500',
    status: 'Disbursed',
    filed: 'Nov 12, 2025',
    timeline: [
      { date: 'Nov 12, 2025 · 10:32 AM', event: 'Claim Submitted', detail: 'FIR, 3 photos, and repair estimate uploaded.', done: true },
      { date: 'Nov 13, 2025 · 2:15 PM',  event: 'Under Review — Adjuster Assigned', detail: 'Adjuster Vikram Shah assigned to case.', done: true },
      { date: 'Nov 15, 2025 · 11:00 AM', event: 'Approved', detail: 'Claim verified. Repair estimate of ₹34,500 approved.', done: true },
      { date: 'Nov 17, 2025 · 4:00 PM',  event: 'Disbursed — ₹34,500', detail: 'Amount credited to bank account ending **4521.', done: true, disburse: true },
    ],
  },
  {
    id: 'CLM-2026-00347',
    policyId: 'SHX-HI-2024-00291',
    type: 'Health',
    icon: '❤️',
    description: 'Emergency hospitalization',
    amount: '₹87,200',
    status: 'Under Review',
    filed: 'Feb 14, 2026',
    timeline: [
      { date: 'Feb 14, 2026 · 3:45 PM', event: 'Claim Submitted', detail: 'Hospital bills, discharge summary, prescription uploaded.', done: true },
      { date: 'Feb 15, 2026 · 9:00 AM', event: 'Under Review ← Current', detail: 'Adjuster Priya Kapoor reviewing medical documents. Expected completion: Mar 3, 2026.', done: false, current: true },
    ],
  },
]

export const PRODUCTS = [
  {
    id: 'life',
    name: 'Life Insurance',
    icon: '🌿',
    iconBg: 'bg-green-100',
    from: '₹850',
    type: 'Life',
    featured: false,
    features: [
      'Term & Whole Life options',
      'Sum assured up to ₹5 Cr',
      'Critical illness rider',
      'Tax benefits under 80C',
    ],
  },
  {
    id: 'health',
    name: 'Health Insurance',
    icon: '❤️',
    iconBg: 'bg-blue-100',
    from: '₹650',
    type: 'Health',
    featured: true,
    features: [
      'Cashless hospitalization',
      'Pre & post hospitalization',
      'Day care procedures',
      'Mental health coverage',
    ],
  },
  {
    id: 'vehicle',
    name: 'Vehicle Insurance',
    icon: '🚗',
    iconBg: 'bg-yellow-100',
    from: '₹420',
    type: 'Vehicle',
    featured: false,
    features: [
      'Own damage & 3rd party',
      'Zero depreciation add-on',
      '24/7 roadside assistance',
      'No-claim bonus up to 50%',
    ],
  },
]

// Status badge styling map
export const STATUS_STYLES = {
  'Active':       'bg-green-100 text-green-800',
  'Renewal Due':  'bg-yellow-100 text-yellow-800',
  'Pending':      'bg-yellow-100 text-yellow-800',
  'Under Review': 'bg-blue-100  text-blue-800',
  'Approved':     'bg-green-100 text-green-800',
  'Disbursed':    'bg-purple-100 text-purple-800',
  'Rejected':     'bg-red-100   text-red-800',
}
