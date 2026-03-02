import React, { createContext, useContext, useState, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('shieldx_user')) }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(getStoredUser)
  const [loading, setLoading] = useState(false)

  const persist = (token, user) => {
    localStorage.setItem('shieldx_token', token)
    localStorage.setItem('shieldx_user',  JSON.stringify(user))
    setUser(user)
  }

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await authAPI.login({ email, password })
      persist(data.token, data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (formData) => {
    setLoading(true)
    try {
      const data = await authAPI.register(formData)
      persist(data.token, data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('shieldx_token')
    localStorage.removeItem('shieldx_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
