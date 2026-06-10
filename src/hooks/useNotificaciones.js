import { useState, useEffect } from 'react'
import { useAuth } from '../modules/auth/useAuth'

/**
 * Hook para notificaciones en tiempo real del usuario autenticado.
 * Sprint 5: conectar con notificacionesService.suscribirseNotificaciones (onSnapshot).
 */
export function useNotificaciones() {
  const { user } = useAuth()
  const [notificaciones, _setNotificaciones] = useState([])
  const [cargando, _setCargando] = useState(false)

  useEffect(() => {
    if (!user) return
    // Sprint 5: return notificacionesService.suscribirseNotificaciones(user.uid, setNotificaciones)
  }, [user])

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return { notificaciones, noLeidas, cargando }
}
