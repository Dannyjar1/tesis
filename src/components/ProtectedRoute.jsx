import { Navigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import LoadingSpinner from './LoadingSpinner'

// Rol unificado "docente" + tipo_contrato (migración §12.10 PROJECT.md)
const HOME_POR_ROL = {
  docente:        '/mi-distributivo',
  administrativo: '/mi-panel',
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

  // Multi-rol: basta con que UNO de los roles del usuario esté permitido.
  const rolesUsuario = user.roles ?? [user.rol]
  if (roles && !rolesUsuario.some(r => roles.includes(r))) {
    return <Navigate to={HOME_POR_ROL[user.rol] ?? '/dashboard'} replace />
  }

  return children
}
