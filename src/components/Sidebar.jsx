import { NavLink } from 'react-router-dom'
import logoUide from '../assets/logo-uide.png'
import { useAuth } from '../modules/auth/useAuth'
import { ROL_LABELS, ROLES, TIPO_CONTRATO_LABELS, CARRERA_LABELS, CARGO_LABELS } from '../utils/constants'

const MENU = {
  [ROLES.SUPERADMIN]: [
    { path: '/sistema',            label: 'Carreras',           icon: IconGrid },
    { path: '/sistema?tab=usuarios', label: 'Usuarios y Roles', icon: IconUsers },
    { path: '/sistema?tab=seed',   label: 'Inicialización',     icon: IconSettings },
    { path: '/notificaciones',     label: 'Notificaciones',     icon: IconBell },
  ],
  [ROLES.ADMIN]: [
    { path: '/dashboard', label: 'Dashboard', icon: IconGrid },
    { path: '/admin/usuarios', label: 'Usuarios', icon: IconUsers },
    { path: '/admin/periodos', label: 'Períodos', icon: IconCalendar },
    { path: '/notificaciones', label: 'Notificaciones', icon: IconBell },
    { path: '/admin/auditoria', label: 'Auditoría', icon: IconClipboard },
    { path: '/admin/configuracion', label: 'Configuración', icon: IconSettings },
  ],
  [ROLES.DIRECTOR]: [
    { path: '/dashboard',           label: 'Dashboard',       icon: IconGrid },
    { path: '/distributivo/gestion',label: 'Distributivos',   icon: IconDocument },
    { path: '/personal',            label: 'Mi Personal',     icon: IconUsers },
    { path: '/mis-actividades',     label: 'Mis Actividades', icon: IconChecklist },
    { path: '/reportes',            label: 'Reportes',        icon: IconChart },
    { path: '/admin/periodos',      label: 'Períodos',        icon: IconCalendar },
    { path: '/notificaciones',      label: 'Notificaciones',  icon: IconBell },
  ],
  [ROLES.COORDINADOR]: [
    { path: '/dashboard',           label: 'Dashboard',       icon: IconGrid },
    { path: '/distributivo/gestion',label: 'Distributivos',   icon: IconDocument },
    { path: '/personal',            label: 'Mi Personal',     icon: IconUsers },
    { path: '/mis-actividades',     label: 'Mis Actividades', icon: IconChecklist },
    { path: '/reportes',            label: 'Reportes',        icon: IconChart },
    { path: '/notificaciones',      label: 'Notificaciones',  icon: IconBell },
  ],
  [ROLES.DOCENTE]: [
    { path: '/mi-distributivo', label: 'Mi Distributivo', icon: IconDocument },
    { path: '/mis-actividades', label: 'Mis Actividades', icon: IconChecklist },
    { path: '/horario',         label: 'Mi Horario',      icon: IconClock },
    { path: '/calendario',      label: 'Calendario',      icon: IconCalendar },
    { path: '/ia',              label: 'Clasificación IA', icon: IconSparkles },
    { path: '/notificaciones',  label: 'Notificaciones',  icon: IconBell },
  ],
  [ROLES.ADMINISTRATIVO]: [
    { path: '/mi-panel',        label: 'Mi Panel',         icon: IconGrid },
    { path: '/mi-distributivo', label: 'Mi Distributivo',  icon: IconDocument },
    { path: '/mis-actividades', label: 'Mis Actividades',  icon: IconChecklist },
    { path: '/reportes',        label: 'Mis Reportes',     icon: IconChart },
    { path: '/horario',         label: 'Mi Horario',       icon: IconClock },
    { path: '/calendario',      label: 'Calendario',       icon: IconCalendar },
    { path: '/ia',              label: 'Clasificación IA', icon: IconSparkles },
    { path: '/notificaciones',  label: 'Notificaciones',   icon: IconBell },
  ],
}

export default function Sidebar({ cerrado, onToggle, onClose }) {
  const { user } = useAuth()
  if (!user) return null

  const items = MENU[user.rol] ?? []
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
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-uide-primary'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
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

function IconGrid({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function IconDocument({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function IconCalendar({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function IconSparkles({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function IconChart({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function IconBell({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function IconUsers({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function IconClipboard({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function IconSettings({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconChecklist({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function IconPlanet({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconClock({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
