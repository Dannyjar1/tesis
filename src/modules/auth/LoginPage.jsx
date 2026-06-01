import { useState } from 'react'
import logoUide from '../../assets/logo-uide.png'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ROLES } from '../../utils/constants'

const HOME_POR_ROL = {
  [ROLES.ADMIN]:          '/dashboard',
  [ROLES.DIRECTOR]:       '/dashboard',
  [ROLES.COORDINADOR]:    '/dashboard',
  [ROLES.ADMINISTRATIVO]: '/mi-panel',
  [ROLES.DOCENTE]:        '/mi-distributivo',
}

const CUENTAS_PRUEBA = [
  { email: 'paruizag@uide.edu.ec',     password: '1234', etiqueta: 'Admin (Pro-Rector)' },
  { email: 'locondezh@uide.edu.ec',    password: '1234', etiqueta: 'Director — Sistemas' },
  { email: 'davalarezole@uide.edu.ec', password: '1234', etiqueta: 'Coordinador — Sistemas' },
  { email: 'mipalaciosmo@uide.edu.ec', password: '1234', etiqueta: 'Docente TC' },
  { email: 'yetorresbe@uide.edu.ec',   password: '1234', etiqueta: 'Docente MT' },
  { email: 'dajaramillogu@uide.edu.ec',password: '1234', etiqueta: 'Administrativo (Danny Jaramillo)' },
]

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)
  const { login, user }         = useAuth()
  const navigate                = useNavigate()

  if (user) {
    return <Navigate to={HOME_POR_ROL[user.rol] ?? '/dashboard'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@uide.edu.ec')) {
      setError('Debes usar tu correo institucional @uide.edu.ec')
      return
    }

    setCargando(true)
    try {
      const userData = await login(email, password)
      navigate(HOME_POR_ROL[userData.rol] ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    /* Mobile: columna única. Desktop (md+): dos columnas, altura completa */
    <div className="flex flex-col md:flex-row md:h-screen">

      {/* ── Panel izquierdo — solo desktop ── */}
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

      {/* ── Panel derecho — ocupa todo en móvil, 35% en desktop ── */}
      <div className="flex flex-col flex-1 bg-[#f0f2f5] md:overflow-y-auto">

        {/* Header azul con logo — solo visible en móvil */}
        <div className="flex md:hidden flex-col items-center justify-center py-10 bg-[#003087]">
          <img src={logoUide} alt="UIDE" className="w-44 object-contain" />
          <p className="text-white/60 text-[10px] uppercase tracking-widest mt-4">Powered by</p>
          <p className="text-white text-xs font-semibold mt-0.5">Arizona State University®</p>
        </div>

        {/* Contenido del formulario */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-8">

          {/* Título */}
          <div className="w-full max-w-sm mb-6">
            <h1 className="text-xl font-bold text-[#003087]">UIDE Campus Loja</h1>
            <p className="text-gray-500 text-sm mt-1">Sistema de Gestión del Distributivo Académico</p>
          </div>

          {/* Card */}
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 sm:p-8">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Iniciar sesión</h2>
            <p className="text-gray-400 text-xs mb-5">Usa tu cuenta institucional @uide.edu.ec</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@uide.edu.ec"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003087] focus:border-transparent transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003087] focus:border-transparent transition text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#003087] hover:bg-[#002060] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1 text-sm"
              >
                {cargando ? 'Verificando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-5">
              Acceso exclusivo para personal institucional UIDE
            </p>
          </div>

          {/* Panel de cuentas de prueba — solo en desarrollo */}
          {import.meta.env.DEV && (
            <div className="mt-4 w-full max-w-sm bg-amber-50 border border-amber-300 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">
                Cuentas de prueba (dev)
              </p>
              <div className="space-y-1">
                {CUENTAS_PRUEBA.map(({ email, password, etiqueta }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => { setEmail(email); setPassword(password) }}
                    className="w-full text-left text-xs text-amber-700 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
                  >
                    <span className="font-semibold">{etiqueta}:</span> {email} / {password}
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
