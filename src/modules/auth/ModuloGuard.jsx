import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { usePermisos } from '../../hooks/usePermisos'
import { MODULOS } from '../../utils/modulos'

const HOME_POR_ROL = {
  superadmin:  '/sistema',
  director:    '/dashboard',
  coordinador: '/dashboard',
  docente:     '/mi-distributivo',
}

/**
 * ModuloGuard — Control de acceso RBAC por MÓDULO (no por rol fijo).
 * La ruta es accesible si CUALQUIERA de los roles activos del usuario otorga
 * el módulo (permisos acumulativos). Si no, redirige al home del usuario o
 * al primer módulo que sí pueda ver (soporta roles personalizados).
 */
export default function ModuloGuard({ modulo, children }) {
  const { user } = useAuth()
  const { tieneModulo } = usePermisos()

  if (!user) return <Navigate to="/login" replace />
  const requeridos = Array.isArray(modulo) ? modulo : [modulo]
  if (requeridos.some(m => tieneModulo(m))) return children

  const home = HOME_POR_ROL[user.rol]
  if (home) return <Navigate to={home} replace />
  const primero = MODULOS.find(m => tieneModulo(m.id))
  return <Navigate to={primero?.path ?? '/perfil'} replace />
}
