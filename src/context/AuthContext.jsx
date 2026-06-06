import { createContext, useState, useEffect } from 'react'
import {
  loginConMicrosoft,
  loginMock as loginMockService,
  logout as logoutService,
  getCurrentUser,
  getResultadoRedireccion,
} from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sesionGuardada = getCurrentUser()

    if (sesionGuardada) {
      // Ya hay sesión guardada — cargar directo
      setUser(sesionGuardada)
      setLoading(false)
    } else {
      // Verificar si venimos de un redirect de Microsoft
      getResultadoRedireccion()
        .then(perfil => {
          if (perfil) setUser(perfil)
        })
        .catch(err => console.error('[Auth] Error al procesar redirect:', err))
        .finally(() => setLoading(false))
    }
  }, [])

  /** Inicia el redirect a Microsoft — la página navega fuera */
  async function login() {
    await loginConMicrosoft()
  }

  /** Login de desarrollo sin redirect — solo panel DEV */
  async function loginMock(email, password) {
    const userData = await loginMockService(email, password)
    setUser(userData)
    return userData
  }

  async function logout() {
    await logoutService()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginMock, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
