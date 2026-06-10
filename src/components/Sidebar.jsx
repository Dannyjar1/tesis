import { NavLink, useLocation } from 'react-router-dom'
import logoUide from '../assets/logo-uide.png'
import { useAuth } from '../modules/auth/useAuth'
import { usePermisos } from '../hooks/usePermisos'
import { MODULOS } from '../utils/modulos'
import { ROL_LABELS, TIPO_CONTRATO_LABELS, CARGO_LABELS } from '../utils/constants'

export default function Sidebar({ cerrado, onClose }) {
  const { user } = useAuth()
  const { tieneModulo } = usePermisos()
  const { pathname, search } = useLocation()
  if (!user) return null

  /** Activo exacto incluyendo query (?tab=...) para las pestañas de /sistema. */
  function esActivo(path) {
    const [p, q] = path.split('?')
    if (p !== pathname) return false
    const tabLink   = new URLSearchParams(q ?? '').get('tab')
    const tabActual = new URLSearchParams(search).get('tab')
    return (tabLink ?? null) === (tabActual ?? null)
  }

  // RBAC dinámico: el menú se construye con la SUMA de los roles activos del
  // usuario (módulos otorgados por sus definiciones de rol, en el orden del
  // registro MODULOS). "Mi Perfil" (RF-038) y "Ayuda" (RF-039) van para todos.
  const items = [
    ...MODULOS
      .filter(m => tieneModulo(m.id))
      .map(m => ({ path: m.path, label: m.label, icon: m.icon })),
    { path: '/perfil', label: 'Mi Perfil', icon: IconUser },
    { path: '/ayuda',  label: 'Ayuda',     icon: IconHelp },
  ]
  const inicial = user.nombre_completo?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      {/* Backdrop — solo móvil, cierra al tocar fuera */}
      {!cerrado && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

    <aside
      className={`
        flex flex-col bg-uide-primary text-white transition-all duration-300
        fixed inset-y-0 left-0 z-50 w-64
        ${cerrado ? '-translate-x-full' : 'translate-x-0'}
        md:relative md:inset-auto md:z-auto md:translate-x-0 md:flex-shrink-0
        ${cerrado ? 'md:w-16' : 'md:w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-6 border-b border-white/10">
        <img
          src={logoUide}
          alt="UIDE"
          className={`object-contain transition-all duration-300 ${cerrado ? 'w-8 h-8' : 'w-28 h-14'}`}
        />
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => {
              // Para rutas con ?tab= el match debe incluir el query exacto
              const activo = path.includes('?') || pathname === '/sistema'
                ? esActivo(path)
                : isActive
              return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activo
                  ? 'bg-white text-uide-primary'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!cerrado && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-1">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-uide-accent flex items-center justify-center text-white text-sm font-bold">
            {inicial}
          </div>
          {!cerrado && (
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.nombre_completo}</p>
              <p className="text-[10px] text-blue-200 truncate">
                {user.tipo_contrato
                  ? TIPO_CONTRATO_LABELS[user.tipo_contrato] ?? ROL_LABELS[user.rol]
                  : user.cargo
                    ? CARGO_LABELS[user.cargo] ?? ROL_LABELS[user.rol]
                    : ROL_LABELS[user.rol]}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  )
}

// --- Íconos SVG inline ---

function IconUser({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function IconHelp({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
