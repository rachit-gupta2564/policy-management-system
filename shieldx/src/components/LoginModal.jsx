import React, { useState } from 'react'
import { Modal, FormGroup, Input, BtnBrand, BtnGhost } from './ui'
import { useToast } from '../App'

export default function LoginModal({ onClose }) {
  const toast = useToast()
  return (
    <Modal title="Sign In to ShieldX" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancel</BtnGhost><BtnBrand onClick={() => { toast('Welcome back, Arjun! ✓','success'); onClose() }}>Sign In →</BtnBrand></>}
    >
      <FormGroup label="Email Address"><Input type="email" placeholder="arjun.mehta@email.com" /></FormGroup>
      <FormGroup label="Password"><Input type="password" placeholder="••••••••" /></FormGroup>
      <div className="flex justify-end mt-1 mb-2">
        <span className="text-sm text-brand font-medium cursor-pointer hover:underline">Forgot password?</span>
      </div>
      <p className="text-xs text-gray-400 mt-4">🔒 All sessions are encrypted with AES-256 standard.</p>
    </Modal>
  )
}