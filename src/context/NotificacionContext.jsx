import { createContext, useState, useEffect, useCallback } from 'react'
import { getCurrentUser } from '../services/authService'
import {
  getNotificaciones,
  marcarLeida as svcMarcarLeida,
  marcarTodasLeidas as svcMarcarTodas,
  resolverSolicitudRol as svcResolverSolicitud,
} from '../services/notificacionesService'

export const NotificacionContext = createContext(null)

export function NotificacionProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([])
  const [uid, setUid] = useState(null)

  const cargar = useCallback(async (docenteUid) => {
    if (!docenteUid) { setNotificaciones([]); return }
    const lista = await getNotificaciones(docenteUid)
    setNotificaciones(lista)
  }, [])

  // Detectar usuario en localStorage (mock) y recargar al cambiar sesión
  useEffect(() => {
    function sincronizar() {
      const user = getCurrentUser()
      const nuevoUid = user?.uid ?? null
      setUid(prev => {
        if (prev !== nuevoUid) cargar(nuevoUid)
        return nuevoUid
      })
    }
    sincronizar()
    const t = setInterval(sincronizar, 3000)
    return () => clearInterval(t)
  }, [cargar])

  const noLeidas = notificaciones.filter(n => !n.leida).length

  async function marcarLeida(id) {
    if (!uid) return
    await svcMarcarLeida(uid, id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  async function marcarTodasLeidas() {
    if (!uid) return
    await svcMarcarTodas(uid)
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  // Director acepta/rechaza una solicitud de rol (F.2)
  async function resolverSolicitud(notif, aceptada) {
    await svcResolverSolicitud(notif, aceptada)
    await cargar(uid)
  }

  return (
    <NotificacionContext.Provider value={{
      notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, resolverSolicitud,
      recargar: () => cargar(uid),
    }}>
      {children}
    </NotificacionContext.Provider>
  )
}
