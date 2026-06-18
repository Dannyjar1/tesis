import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ROLES } from '../../utils/constants'

const HOME_POR_ROL = {
  [ROLES.SUPERADMIN]:  '/sistema',
  [ROLES.DIRECTOR]:    '/dashboard',
  [ROLES.COORDINADOR]: '/dashboard',
  [ROLES.DOCENTE]:     '/mi-distributivo',
}

/**
 * Restringe el acceso a roles específicos. Si el rol no está permitido,
 * redirige al home correspondiente del usuario autenticado.
 */
export default function RoleGuard({ roles, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  // Multi-rol: basta con que UNO de los roles del usuario esté permitido.
  const rolesUsuario = user.roles ?? [user.rol]
  if (roles && !rolesUsuario.some(r => roles.includes(r))) {
    return <Navigate to={HOME_POR_ROL[user.rol] ?? '/dashboard'} replace />
  }

  return children
}
