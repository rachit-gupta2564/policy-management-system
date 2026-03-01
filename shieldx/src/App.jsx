import React, { createContext, useContext, useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CalculatorPage from './pages/CalculatorPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import ToastContainer from './components/ToastContainer'

export const ToastContext = createContext(null)
export function useToast() { return useContext(ToastContext) }

export default function App() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3600)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      <div className="min-h-screen bg-surface font-sans">
        <Navbar />
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/admin"      element={<AdminPage />} />
          <Route path="*"           element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}