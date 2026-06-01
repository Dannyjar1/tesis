import { createContext, useState, useEffect } from 'react'
import { login as loginService, logout as logoutService, getCurrentUser } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getCurrentUser())
    setLoading(false)
  }, [])

  async function login(email, password) {
    const userData = await loginService(email, password)
    setUser(userData)
    return userData
  }

  async function logout() {
    await logoutService()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
