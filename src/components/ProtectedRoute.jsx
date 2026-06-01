import { Navigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import LoadingSpinner from './LoadingSpinner'

const HOME_POR_ROL = {
  docente_tc: '/mi-distributivo',
  docente_mt: '/mi-distributivo',
  docente_tp: '/mi-distributivo',
}

/**
 * HOC que protege una ruta verificando autenticación y rol del usuario.
 * Si el rol no está autorizado, redirige al home correspondiente del usuario.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to={HOME_POR_ROL[user.rol] ?? '/dashboard'} replace />
  }

  return children
}
