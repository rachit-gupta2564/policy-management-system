import React, { useState } from 'react'
import { Modal, FormGroup, Select, Input, Textarea, BtnBrand, BtnGhost, UploadZone } from './ui'
import { useToast } from '../App'
import { POLICIES } from '../data/mockData'

export default function ClaimModal({ onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({
    policyId: POLICIES[0].id,
    date: '2026-02-14',
    description: '',
    amount: '',
  })

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const submit = () => {
    toast('Claim CLM-2026-00412 submitted! Our adjuster will contact you within 24 hours.', 'success')
    onClose()
  }

  return (
    <Modal
      title="File a New Claim"
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnBrand onClick={submit}>Submit Claim →</BtnBrand>
        </>
      }
    >
      <FormGroup label="Select Policy">
        <Select value={form.policyId} onChange={set('policyId')}>
          {POLICIES.map(p => (
            <option key={p.id} value={p.id}>{p.id} — {p.type} Insurance</option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Incident Date">
        <Input type="date" value={form.date} onChange={set('date')} />
      </FormGroup>

      <FormGroup label="Incident Description">
        <Textarea
          placeholder="Describe the incident in detail — location, time, persons involved, and extent of damage / loss..."
          value={form.description}
          onChange={set('description')}
        />
      </FormGroup>

      <FormGroup label="Claim Amount (₹)">
        <Input type="number" placeholder="87200" value={form.amount} onChange={set('amount')} />
      </FormGroup>

      <FormGroup label="Upload Evidence (Photos, Reports, Bills)">
        <UploadZone
          label="Click to upload evidence"
          sub="Photos, FIR, Hospital bills, Repair estimates (max 10 MB each)"
          onClick={() => toast('Files uploaded successfully!', 'success')}
        />
      </FormGroup>
    </Modal>
  )
}
