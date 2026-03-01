const GST = 0.18

// NCB schedule per IRDAI rules
export const NCB_SCHEDULE = { 0:0, 1:20, 2:25, 3:35, 4:45, 5:50 }
export const getNCBPercent = (claimFreeYears) => NCB_SCHEDULE[Math.min(claimFreeYears, 5)] || 0

export function calcVehicle({ idv, makeFactor=1, yearFactor=1, coverageType='comprehensive', ncbPercent=0, addons={} }) {
  const cf   = coverageType === 'comprehensive' ? 1.5 : 1.0
  const base = idv * 0.02 * makeFactor * yearFactor * cf
  const ncb  = base * (ncbPercent / 100)
  const add  = (addons.zeroDep  ? idv * 0.005 : 0)
             + (addons.roadside ? 999          : 0)
             + (addons.engine   ? 1299          : 0)
             + (addons.rti      ? idv * 0.004   : 0)
  const gst  = (base - ncb + add) * GST
  const total = base - ncb + add + gst
  return { basePremium: Math.round(base), ncbDiscount: Math.round(ncb), addonAmount: Math.round(add), gstAmount: Math.round(gst), totalPremium: Math.round(total) }
}

export function calcHealth({ age, sumLakhs, planType='individual', preExisting='none' }) {
  const af = age < 30 ? 1 : age < 40 ? 1.15 : age < 50 ? 1.35 : age < 60 ? 1.6 : 2.0
  const pf = { individual:1, family_2:1.4, family_4:1.6 }[planType] || 1
  const pec = { none:1, diabetes:1.15, hypertension:1.2, both:1.3 }[preExisting] || 1
  const base = sumLakhs * 500 * af * pf * pec
  const gst  = base * GST
  return { basePremium: Math.round(base), ncbDiscount:0, addonAmount:0, gstAmount: Math.round(gst), totalPremium: Math.round(base + gst) }
}

export function calcLife({ age, termYears, sumLakhs, isSmoker=false }) {
  const af = age < 30 ? 0.85 : age < 35 ? 1 : age < 40 ? 1.3 : age < 45 ? 1.7 : age < 50 ? 2.2 : 2.8
  const tf = termYears <= 10 ? 0.9 : termYears <= 15 ? 1 : termYears <= 20 ? 1.1 : 1.25
  const sf = isSmoker ? 1.45 : 1
  const base = sumLakhs * 120 * af * tf * sf
  const gst  = base * GST
  return { basePremium: Math.round(base), ncbDiscount:0, addonAmount:0, gstAmount: Math.round(gst), totalPremium: Math.round(base + gst) }
}

export function calculatePremium(type, params) {
  if (type === 'vehicle') return calcVehicle(params)
  if (type === 'health')  return calcHealth(params)
  if (type === 'life')    return calcLife(params)
  throw new Error(`Unknown type: ${type}`)
}
