import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../modules/auth/useAuth'
import {
  getEventosCalendario,
  sincronizarCalendario,
  autorizarCalendario,
  revocarCalendario,
  isCalendarioAutorizado,
  getUltimaSync,
  getInfoCuentaOutlook,
} from '../services/calendarioService'
import { usePeriodo } from '../context/PeriodoContext'

/**
 * Hook principal del módulo de calendario.
 * Gestiona eventos, autorización MSAL y sincronización con Graph API.
 * RF-013, RF-014.
 */
export function useCalendario(periodoId) {
  const { user }          = useAuth()
  const { periodoActivo } = usePeriodo()

  const [eventos,       setEventos]       = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [autorizando,   setAutorizando]   = useState(false)
  const [autorizado,    setAutorizado]    = useState(false)
  const [cuentaOutlook, setCuentaOutlook] = useState(null)
  const [ultimaSync,    setUltimaSync]    = useState(null)
  const [error,         setError]         = useState(null)

  const uid = user?.uid ?? user?.id

  const cargar = useCallback(async () => {
    if (!uid || !periodoId) { setCargando(false); return }
    setCargando(true)
    setError(null)
    try {
      // isCalendarioAutorizado es ahora async (comprueba sesión MSAL primero)
      const estaAutorizado = await isCalendarioAutorizado(uid)
      setAutorizado(estaAutorizado)
      setUltimaSync(getUltimaSync(uid, periodoId))

      if (estaAutorizado) {
        const info  = await getInfoCuentaOutlook()
        setCuentaOutlook(info)
        const lista = await getEventosCalendario(uid, periodoId)
        setEventos(lista)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [uid, periodoId])

  useEffect(() => { cargar() }, [cargar])

  async function sincronizar() {
    setError(null)
    setSincronizando(true)
    try {
      const { sincronizados, fuente } = await sincronizarCalendario(
        uid,
        periodoId,
        periodoActivo?.fecha_inicio,
        periodoActivo?.fecha_fin,
      )
      const lista = await getEventosCalendario(uid, periodoId)
      setEventos(lista)
      setUltimaSync(getUltimaSync(uid, periodoId))
      return { sincronizados, fuente }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSincronizando(false)
    }
  }

  async function autorizar() {
    setError(null)
    setAutorizando(true)
    try {
      // autorizarCalendario() ya no recibe uid — lanza popup MSAL
      await autorizarCalendario()
      const info = await getInfoCuentaOutlook()
      setCuentaOutlook(info)
      setAutorizado(true)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setAutorizando(false)
    }
  }

  async function revocar() {
    setError(null)
    try {
      await revocarCalendario()
      setAutorizado(false)
      setCuentaOutlook(null)
      setEventos([])
      setUltimaSync(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    eventos,
    cargando,
    sincronizando,
    autorizando,
    autorizado,
    cuentaOutlook,
    ultimaSync,
    error,
    sincronizar,
    autorizar,
    revocar,
    recargar: cargar,
  }
}
