import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ROLES } from '../../utils/constants'

const HOME_POR_ROL = {
  [ROLES.ADMIN]:          '/dashboard',
  [ROLES.DIRECTOR]:       '/dashboard',
  [ROLES.COORDINADOR]:    '/dashboard',
  [ROLES.ADMINISTRATIVO]: '/mi-panel',
  [ROLES.DOCENTE]:        '/mi-distributivo',
}

/**
 * Restringe el acceso a roles específicos. Si el rol no está permitido,
 * redirige al home correspondiente del usuario autenticado.
 */
export default function RoleGuard({ roles, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) {
    return <Navigate to={HOME_POR_ROL[user.rol] ?? '/dashboard'} replace />
  }

  return children
}
