import React, { useState } from 'react'
import { Modal, FormGroup, Select, Input, Textarea, BtnBrand, BtnGhost } from './ui'
import { useToast } from '../App'
import { claimsAPI } from '../services/api'

export default function ClaimModal({ onClose, policies = [] }) {
  const toast = useToast()
  const [step, setStep]       = useState(1) // 1=form, 2=success
  const [submitting, setSub]  = useState(false)
  const [claimNum,   setCNum] = useState('')
  const [files,      setFiles] = useState([])
  const [form, setForm] = useState({
    policy_id:    policies[0]?.id || '',
    incident_date: new Date().toISOString().split('T')[0],
    description:  '',
    claim_amount: '',
  })
  const [error, setError] = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const activePolicies = policies.filter(p => p.status === 'active')

  const submit = async () => {
    setError('')
    if (!form.policy_id)     { setError('Please select a policy'); return }
    if (!form.incident_date) { setError('Please enter the incident date'); return }
    if (!form.description.trim()) { setError('Please describe the incident'); return }
    if (!form.claim_amount || +form.claim_amount <= 0) { setError('Please enter a valid claim amount'); return }

    setSub(true)
    try {
      const fd = new FormData()
      fd.append('policy_id',     form.policy_id)
      fd.append('incident_date', form.incident_date)
      fd.append('description',   form.description)
      fd.append('claim_amount',  form.claim_amount)
      files.forEach(f => fd.append('documents', f))

      const data = await claimsAPI.file(fd)
      if (data.error) throw new Error(data.error)
      setCNum(data.claim?.claim_number || 'CLM-NEW')
      setStep(2)
      toast('Claim submitted! Our adjuster will contact you within 24 hours.', 'success')
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSub(false)
    }
  }

  if (step === 2) return (
    <Modal title="Claim Submitted ✓" onClose={() => onClose(true)}
      footer={<BtnBrand onClick={() => onClose(true)}>Done</BtnBrand>}>
      <div className="text-center py-6">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-display text-xl font-bold mb-2">Claim Received</h3>
        <div className="font-mono-dm text-brand text-lg font-bold mb-2">{claimNum}</div>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">
          Our claims adjuster will review your submission and contact you within 24 hours.
          Track the status in your Claims tab.
        </p>
      </div>
    </Modal>
  )

  return (
    <Modal title="File a New Claim" onClose={() => onClose(false)}
      footer={
        <>
          <BtnGhost onClick={() => onClose(false)}>Cancel</BtnGhost>
          <BtnBrand onClick={submit} className="min-w-[140px]">
            {submitting ? 'Submitting…' : 'Submit Claim →'}
          </BtnBrand>
        </>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">⚠ {error}</div>
      )}

      {activePolicies.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">📋</div>
          <p>You have no active policies to file a claim against.</p>
        </div>
      ) : (
        <>
          <FormGroup label="Select Policy">
            <Select value={form.policy_id} onChange={set('policy_id')}>
              {activePolicies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policy_number} — {p.type} (Sum: ₹{Number(p.sum_assured).toLocaleString('en-IN')})
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Incident Date">
            <Input type="date" value={form.incident_date} onChange={set('incident_date')}
              max={new Date().toISOString().split('T')[0]} />
          </FormGroup>

          <FormGroup label="Incident Description">
            <Textarea
              placeholder="Describe the incident — location, time, persons involved, extent of damage or loss…"
              value={form.description} onChange={set('description')} />
          </FormGroup>

          <FormGroup label="Claim Amount (₹)">
            <Input type="number" placeholder="Enter amount" min="1"
              value={form.claim_amount} onChange={set('claim_amount')} />
          </FormGroup>

          <FormGroup label="Upload Evidence (optional)">
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-brand hover:bg-brand-pale transition-colors">
              <span className="text-2xl mb-1">📎</span>
              <span className="text-sm font-semibold text-gray-600">
                {files.length ? `${files.length} file(s) selected` : 'Click to attach files'}
              </span>
              <span className="text-xs text-gray-400 mt-1">Photos, FIR, Hospital bills, Repair estimates (max 10MB each)</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setFiles(Array.from(e.target.files))} />
            </label>
          </FormGroup>
        </>
      )}
    </Modal>
  )
}

