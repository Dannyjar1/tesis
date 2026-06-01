import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../modules/auth/useAuth'
import {
  getClasificaciones,
  clasificarLote,
  registrarFeedback,
  getEstadisticas,
} from '../services/iaService'
import { getEventosCalendario } from '../services/calendarioService'

/**
 * Hook para el módulo de clasificación IA.
 * Gestiona el estado de clasificaciones, el proceso en lote y las correcciones.
 */
export function useClasificacion(periodoId) {
  const { user } = useAuth()
  const [clasificaciones, setClasificaciones] = useState([])
  const [eventos, setEventos] = useState([])
  const [clasificando, setClasificando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [progreso, setProgreso] = useState(0) // 0-100 durante clasificación en lote

  const cargar = useCallback(async () => {
    if (!user || !periodoId) { setCargando(false); return }
    setCargando(true)
    setError(null)
    try {
      const [clases, evs] = await Promise.all([
        getClasificaciones(user.uid, periodoId),
        getEventosCalendario(user.uid, periodoId),
      ])
      setClasificaciones(clases)
      setEventos(evs)
      setEstadisticas(getEstadisticas(user.uid, periodoId))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [user, periodoId])

  useEffect(() => { cargar() }, [cargar])

  async function clasificarTodos() {
    if (!user || !periodoId) return
    setError(null)
    setClasificando(true)
    setProgreso(0)

    try {
      // Cargar eventos frescos para ver los pendientes
      const evsFrescos = await getEventosCalendario(user.uid, periodoId)
      const pendientes = evsFrescos.filter(e => e.estado_clasificacion === 'pendiente')

      if (pendientes.length === 0) return { clasificadas: 0, errores: 0 }

      // Simular progreso durante la clasificación en lote
      let done = 0
      const total = pendientes.length

      // Procesamos en batches de 5 para actualizar el progreso
      const BATCH = 5
      let clasificadas = 0
      let errores = 0

      for (let i = 0; i < pendientes.length; i += BATCH) {
        const batch = pendientes.slice(i, i + BATCH)
        const res = await clasificarLote(batch, user.uid, periodoId)
        clasificadas += res.clasificadas
        errores += res.errores
        done = Math.min(i + BATCH, total)
        setProgreso(Math.round((done / total) * 100))
      }

      await cargar()
      return { clasificadas, errores }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setClasificando(false)
      setProgreso(0)
    }
  }

  async function corregir(clasificacionId, categoriaCorrecta) {
    setError(null)
    try {
      await registrarFeedback(clasificacionId, categoriaCorrecta, user.uid, periodoId)
      await cargar()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const pendientesCount = eventos.filter(e => e.estado_clasificacion === 'pendiente').length
  const provisionalesCount = clasificaciones.filter(c => !c.fue_corregida).length
  const corregidasCount = clasificaciones.filter(c => c.fue_corregida).length

  return {
    clasificaciones,
    eventos,
    clasificando,
    cargando,
    error,
    estadisticas,
    progreso,
    pendientesCount,
    provisionalesCount,
    corregidasCount,
    clasificarTodos,
    corregir,
    recargar: cargar,
  }
}
