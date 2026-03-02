import React, { createContext, useContext, useState, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import CalculatorPage from './pages/CalculatorPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import UnderwriterPage from './pages/UnderwriterPage'
import AdjusterPage from './pages/AdjusterPage'
import ToastContainer from './components/ToastContainer'
import { AuthProvider, useAuth } from './context/AuthContext'

export const ToastContext = createContext(null)
export function useToast() { return useContext(ToastContext) }

// Redirect to login (landing) if not authenticated
function RequireAuth({ children, allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/" state={{ from: location }} replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome = { admin: '/admin', underwriter: '/underwriter', adjuster: '/adjuster', customer: '/dashboard' }
    return <Navigate to={roleHome[user.role] || '/'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Landing / Login - if already logged in, redirect to role home */}
      <Route path="/" element={
        user
          ? <Navigate to={{ admin: '/admin', underwriter: '/underwriter', adjuster: '/adjuster', customer: '/dashboard' }[user.role] || '/dashboard'} replace />
          : <LandingPage />
      } />

      {/* Customer */}
      <Route path="/dashboard" element={
        <RequireAuth allowedRoles={['customer']}><DashboardPage /></RequireAuth>
      } />
      <Route path="/calculator" element={
        <RequireAuth allowedRoles={['customer']}><CalculatorPage /></RequireAuth>
      } />

      {/* Staff */}
      <Route path="/admin" element={
        <RequireAuth allowedRoles={['admin']}><AdminPage /></RequireAuth>
      } />
      <Route path="/underwriter" element={
        <RequireAuth allowedRoles={['underwriter']}><UnderwriterPage /></RequireAuth>
      } />
      <Route path="/adjuster" element={
        <RequireAuth allowedRoles={['adjuster']}><AdjusterPage /></RequireAuth>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3600)
  }, [])

  return (
    <AuthProvider>
      <ToastContext.Provider value={showToast}>
        <div className="min-h-screen bg-surface font-sans text-gray-900">
          <Navbar />
          <AppRoutes />
          <ToastContainer toasts={toasts} />
        </div>
      </ToastContext.Provider>
    </AuthProvider>
  )
}
