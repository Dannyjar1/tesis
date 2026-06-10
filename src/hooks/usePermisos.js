/**
 * usePermisos — Permisos RBAC efectivos del usuario autenticado.
 * Acumula módulos y acciones de TODOS los roles activos del usuario
 * (la interfaz se construye con la suma de roles, no con uno solo).
 *
 * Primer render: cálculo síncrono (seed + overlay local) para que el menú
 * exista de inmediato; luego se refresca desde Firestore si hay definiciones.
 */
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../modules/auth/useAuth'
import { getDefiniciones, getDefinicionesSync, computarPermisos } from '../services/rolesService'
import { MODULOS_LIBRES } from '../utils/modulos'

export function usePermisos() {
  const { user } = useAuth()
  const [definiciones, setDefiniciones] = useState(getDefinicionesSync)

  useEffect(() => {
    let activo = true
    getDefiniciones().then(defs => { if (activo) setDefiniciones(defs) })
    return () => { activo = false }
  }, [user?.uid])

  const permisos = useMemo(
    () => computarPermisos(user?.roles ?? (user?.rol ? [user.rol] : []), definiciones),
    [user, definiciones],
  )

  /** ¿El usuario puede ver el módulo? (perfil/ayuda/notificaciones son libres) */
  function tieneModulo(moduloId) {
    return MODULOS_LIBRES.includes(moduloId) || permisos.modulos.has(moduloId)
  }

  /** ¿El usuario puede ejecutar la acción sobre el módulo? */
  function tieneAccion(moduloId, accion) {
    return permisos.acciones[moduloId]?.has(accion) ?? false
  }

  return { permisos, definiciones, tieneModulo, tieneAccion }
}
