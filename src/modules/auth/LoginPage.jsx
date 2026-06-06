import { useState } from 'react'
import logoUide from '../../assets/logo-uide.png'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ROLES, ROL_LABELS } from '../../utils/constants'

const HOME_POR_ROL = {
  [ROLES.SUPERADMIN]:     '/sistema',
  [ROLES.ADMIN]:          '/dashboard',
  [ROLES.DIRECTOR]:       '/dashboard',
  [ROLES.COORDINADOR]:    '/dashboard',
  [ROLES.ADMINISTRATIVO]: '/mi-panel',
  [ROLES.DOCENTE]:        '/mi-distributivo',
}

const CUENTAS_PRUEBA = [
  { email: 'hcueva@uide.edu.ec',       password: '1234', etiqueta: 'TIC — Cueva (Superadmin)',       rol: 'superadmin' },
  { email: 'paruizag@uide.edu.ec',     password: '1234', etiqueta: 'Admin — Pro-Rector Ruiz',        rol: 'admin' },
  { email: 'locondezh@uide.edu.ec',    password: '1234', etiqueta: 'Director — Sistemas',            rol: 'director' },
  { email: 'davalarezole@uide.edu.ec', password: '1234', etiqueta: 'Coordinador — Sistemas',         rol: 'coordinador' },
  { email: 'mipalaciosmo@uide.edu.ec', password: '1234', etiqueta: 'Docente TC — Palacios',          rol: 'docente' },
  { email: 'yetorresbe@uide.edu.ec',   password: '1234', etiqueta: 'Docente MT — Torres',            rol: 'docente' },
  { email: 'dajaramillogu@uide.edu.ec',password: '1234', etiqueta: 'Administrativo — Jaramillo',     rol: 'administrativo' },
]

const ROL_BADGE = {
  superadmin:     'bg-red-100 text-red-800',
  admin:          'bg-[#003087]/10 text-[#003087]',
  director:       'bg-blue-100 text-blue-700',
  coordinador:    'bg-purple-100 text-purple-700',
  docente:        'bg-green-100 text-green-700',
  administrativo: 'bg-orange-100 text-orange-700',
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

export default function LoginPage() {
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)
  const { login, loginMock, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    return <Navigate to={HOME_POR_ROL[user.rol] ?? '/dashboard'} replace />
  }

  async function handleMicrosoftLogin() {
    setError('')
    setCargando(true)
    try {
      await login()
      // signInWithRedirect navega la página fuera — el resultado se
      // recoge en AuthContext al volver (getResultadoRedireccion).
    } catch (err) {
      const cancelado =
        err?.code      === 'auth/popup-closed-by-user'    ||
        err?.code      === 'auth/cancelled-popup-request' ||
        err?.errorCode === 'user_cancelled'               ||
        err?.errorCode === 'popup_window_error'           ||
        err?.message?.includes('user_cancelled')          ||
        err?.message?.includes('popup-closed-by-user')
      if (!cancelado) {
        setError(err?.message ?? 'Error al iniciar sesión con Microsoft.')
      }
      setCargando(false)
    }
    // No hay finally: si el redirect tuvo éxito la página ya navegó fuera.
  }

  async function handleCuentaPrueba(email, password) {
    setError('')
    setCargando(true)
    try {
      const userData = await loginMock(email, password)
      navigate(HOME_POR_ROL[userData.rol] ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message ?? 'Error al iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:h-screen">

      {/* ── Panel izquierdo — solo desktop ─────────────────────────────────── */}
      <div className="hidden md:flex md:w-[65%] flex-shrink-0 bg-[#003087] flex-col items-center justify-center gap-10 px-12">
        <img
          src={logoUide}
          alt="UIDE"
          className="w-[300px] lg:w-[340px] max-w-[70%] object-contain"
        />
        <div className="text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Powered by</p>
          <p className="text-white text-sm font-semibold tracking-wide">Arizona State University®</p>
        </div>
      </div>

      {/* ── Panel derecho ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 bg-[#f0f2f5] md:overflow-y-auto">

        {/* Header azul — solo móvil */}
        <div className="flex md:hidden flex-col items-center justify-center py-10 bg-[#003087]">
          <img src={logoUide} alt="UIDE" className="w-44 object-contain" />
          <p className="text-white/60 text-[10px] uppercase tracking-widest mt-4">Powered by</p>
          <p className="text-white text-xs font-semibold mt-0.5">Arizona State University®</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-8">

          {/* Títulos */}
          <div className="w-full max-w-sm mb-6">
            <h1 className="text-xl font-bold text-[#003087]">UIDE Campus Loja</h1>
            <p className="text-gray-500 text-sm mt-1">Sistema de Gestión del Distributivo Académico</p>
          </div>

          {/* Card de login */}
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 sm:p-8">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Iniciar sesión</h2>
            <p className="text-gray-400 text-xs mb-6">
              Usa tu cuenta institucional <span className="font-medium text-gray-500">@uide.edu.ec</span>
            </p>

            {/* Botón Microsoft */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={cargando}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm text-sm"
            >
              {cargando ? (
                <span className="w-[18px] h-[18px] border-2 border-gray-300 border-t-[#003087] rounded-full animate-spin flex-shrink-0" />
              ) : (
                <MicrosoftIcon />
              )}
              <span>
                {cargando ? 'Redirigiendo a Microsoft...' : 'Continuar con Microsoft'}
              </span>
            </button>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-6">
              Acceso exclusivo para personal institucional UIDE
            </p>
          </div>

          {/* ── Panel de cuentas de prueba — solo en desarrollo ─────────────── */}
          {import.meta.env.DEV && (
            <div className="mt-4 w-full max-w-sm bg-amber-50 border border-amber-300 rounded-xl p-4">
              <p className="text-[11px] font-bold text-amber-800 mb-3 uppercase tracking-wide">
                Acceso rápido (dev)
              </p>
              <div className="space-y-1.5">
                {CUENTAS_PRUEBA.map(({ email, password, etiqueta, rol }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => handleCuentaPrueba(email, password)}
                    disabled={cargando}
                    className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${ROL_BADGE[rol]}`}>
                      {ROL_LABELS[rol] ?? rol}
                    </span>
                    <span className="text-xs text-amber-800 truncate">{etiqueta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
