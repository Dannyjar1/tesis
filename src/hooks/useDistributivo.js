import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../modules/auth/useAuth'
import {
  getDistributivo,
  getDistributivosPorPeriodo,
  crearDistributivo,
  actualizarDistributivo,
  aprobarDistributivo,
  cambiarEstadoDistributivo,
  getDocentesMock,
} from '../services/distributivoService'

/**
 * Hook para gestión del distributivo del docente autenticado.
 * Sprint Firebase: suscribirseDistributivo(onSnapshot) reemplaza la carga manual.
 */
export function useDistributivo(periodoId) {
  const { user } = useAuth()
  const [distributivo, setDistributivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
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

  useEffect(() => { cargar() }, [cargar])

  return { distributivo, cargando, error, recargar: cargar }
}

/**
 * Hook para el director: gestiona distributivos de todos los docentes del período.
 */
export function useGestionDistributivos(periodoId) {
  const { user } = useAuth()
  const [distributivos, setDistributivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!periodoId) return
    setCargando(true)
    try {
      const lista = await getDistributivosPorPeriodo(periodoId)
      setDistributivos(lista)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [periodoId])

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

  const docentes = getDocentesMock()

  return { distributivos, docentes, cargando, error, recargar: cargar, crear, actualizar, aprobar, cambiarEstado }
}
