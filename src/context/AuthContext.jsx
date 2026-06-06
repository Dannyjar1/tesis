import { createContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import {
  loginConMicrosoft,
  loginMock as loginMockService,
  logout as logoutService,
  getCurrentUser,
  resolverPerfilDesdeFirebase,
  procesarRedirect,
} from '../services/authService'
import { authLog } from '../services/authDebug'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(getCurrentUser())
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    authLog('AuthProvider:mount', `origin=${window.location.origin}`)
    if (!auth) { authLog('AuthProvider', 'auth=null (firebase no config)'); setLoading(false); return }

    let unsub = () => {}

    // 1. Procesar el retorno del redirect de Microsoft (captura errores)
    procesarRedirect()
      .catch(err => {
        setAuthError(err.message)
      })
      .finally(() => {
        // 2. Escuchar el estado de Firebase (resuelve el perfil al volver/recargar)
        unsub = onAuthStateChanged(auth, async (firebaseUser) => {
          authLog('onAuthStateChanged', firebaseUser
            ? `email=${firebaseUser.email ?? '(sin email)'} uid=${firebaseUser.uid?.slice(0,8)}`
            : 'sin usuario firebase')
          if (firebaseUser?.email || firebaseUser?.providerData?.length) {
            try {
              const perfil = await resolverPerfilDesdeFirebase(firebaseUser)
              authLog('AuthProvider:setUser', `${perfil.rol} (${perfil.email})`)
              setUser(perfil)
              setAuthError(null)
            } catch (err) {
              authLog('AuthProvider:perfil-error', err.message)
              setAuthError(err.message)
            }
          } else {
            setUser(getCurrentUser())
          }
          setLoading(false)
        })
      })

    return () => unsub()
  }, [])

  async function login() {
    setAuthError(null)
    return loginConMicrosoft() // navega fuera (redirect)
  }

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
    <AuthContext.Provider value={{ user, loading, authError, login, loginMock, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
