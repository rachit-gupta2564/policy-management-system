export function calcVehicle({ idv, makeFactor, yearFactor, coverageFactor, ncbRate, addons }) {
  const base   = idv * 0.02 * makeFactor * yearFactor * coverageFactor
  const ncb    = base * ncbRate
  const after  = base - ncb
  const addAmt = (addons.zeroDepre ? idv * 0.005 : 0)
               + (addons.roadside  ? 999          : 0)
               + (addons.engine    ? 1299          : 0)
               + (addons.rti       ? idv * 0.004   : 0)
  const gst   = (after + addAmt) * 0.18
  const total = after + addAmt + gst
  return { base, ncb, addons: addAmt, gst, total }
}

export function calcHealth({ age, sumLakhs, planFactor, pecFactor }) {
  const ageFactor = age < 30 ? 1 : age < 40 ? 1.15 : age < 50 ? 1.35 : age < 60 ? 1.6 : 2.0
  const base  = sumLakhs * 500 * ageFactor * planFactor * pecFactor
  const gst   = base * 0.18
  const total = base + gst
  return { base, ncb: 0, addons: 0, gst, total, ageFactor }
}

export function calcLife({ age, termYears, sumLakhs, smokerFactor }) {
  const ageFactor  = age < 30 ? 0.85 : age < 35 ? 1 : age < 40 ? 1.3 : age < 45 ? 1.7 : age < 50 ? 2.2 : 2.8
  const termFactor = termYears <= 10 ? 0.9 : termYears <= 15 ? 1 : termYears <= 20 ? 1.1 : 1.25
  const base  = sumLakhs * 120 * ageFactor * termFactor * smokerFactor
  const gst   = base * 0.18
  const total = base + gst
  return { base, ncb: 0, addons: 0, gst, total, ageFactor, termFactor }
}

export const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN')