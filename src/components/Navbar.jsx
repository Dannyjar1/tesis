import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import { ROL_LABELS } from '../utils/constants'
import NotificationBell from './NotificationBell'

export default function Navbar({ sidebarCerrado, onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const inicial = user?.nombre_completo?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      {/* Botón toggle sidebar */}
      <button
        onClick={onToggleSidebar}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={sidebarCerrado ? 'M4 6h16M4 12h16M4 18h16' : 'M4 6h16M4 12h10M4 18h16'} />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* Info usuario */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.nombre_completo}</p>
            <p className="text-xs text-gray-400">{ROL_LABELS[user?.rol]}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-uide-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {inicial}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
