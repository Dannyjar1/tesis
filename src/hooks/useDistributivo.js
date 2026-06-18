import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../modules/auth/useAuth'
import {
  getDistributivo,
  getDistributivosPorPeriodo,
  crearDistributivo,
  actualizarDistributivo,
  aprobarDistributivo,
  confirmarDistributivoDocente,
  observarDistributivo,
  cambiarEstadoDistributivo,
  suscribirseDistributivo,
  getDocentes,
} from '../services/distributivoService'

/**
 * Hook para el distributivo del docente autenticado.
 * Usa onSnapshot (Firestore) o polling (localStorage) para actualizaciones en tiempo real.
 */
export function useDistributivo(periodoId) {
  const { user } = useAuth()
  const [distributivo, setDistributivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !periodoId) { setCargando(false); return }
    setCargando(true)
    const unsub = suscribirseDistributivo(user.uid, periodoId, (data) => {
      setDistributivo(data)
      setCargando(false)
    })
    return unsub
  }, [user, periodoId])

  const recargar = useCallback(async () => {
    if (!user || !periodoId) return
    setCargando(true)
    try {
      const d = await getDistributivo(user.uid, periodoId)
      setDistributivo(d)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [user, periodoId])

  // Segunda firma del flujo de doble aprobación (director + docente).
  const confirmar = useCallback(async () => {
    if (!distributivo) return
    const actualizado = await confirmarDistributivoDocente(distributivo.id, user?.uid)
    setDistributivo(actualizado)
    return actualizado
  }, [distributivo, user])

  const observar = useCallback(async (observacion) => {
    if (!distributivo) return
    const actualizado = await observarDistributivo(distributivo.id, observacion)
    setDistributivo(actualizado)
    return actualizado
  }, [distributivo])

  return { distributivo, cargando, error, recargar, confirmar, observar }
}

/**
 * Hook para el director: gestiona distributivos de todos los docentes del período.
 */
export function useGestionDistributivos(periodoId, carreraId = null) {
  const { user } = useAuth()
  const [distributivos, setDistributivos] = useState([])
  const [docentes, setDocentes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!periodoId) { setCargando(false); return }
    setCargando(true)
    try {
      const [lista, docentesList] = await Promise.all([
        getDistributivosPorPeriodo(periodoId),
        getDocentes(carreraId),
      ])
      setDistributivos(lista)
      setDocentes(docentesList)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [periodoId, carreraId])

  useEffect(() => { cargar() }, [cargar])

  async function crear(datos) {
    const nuevo = await crearDistributivo(datos)
    await cargar()
    return nuevo
  }

  async function actualizar(id, cambios) {
    const actualizado = await actualizarDistributivo(id, cambios)
    await cargar()
    return actualizado
  }

  async function aprobar(id, horasContrato) {
    const aprobado = await aprobarDistributivo(id, user?.uid, horasContrato)
    await cargar()
    return aprobado
  }

  async function cambiarEstado(id, nuevoEstado) {
    await cambiarEstadoDistributivo(id, nuevoEstado)
    await cargar()
  }

  return { distributivos, docentes, cargando, error, recargar: cargar, crear, actualizar, aprobar, cambiarEstado }
}
