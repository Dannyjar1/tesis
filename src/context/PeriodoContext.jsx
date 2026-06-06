import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getPeriodos,
  crearPeriodo,
  activarPeriodo,
  cerrarPeriodo,
} from '../services/periodoService'

export const PeriodoContext = createContext(null)

export function usePeriodo() {
  return useContext(PeriodoContext)
}

export function PeriodoProvider({ children }) {
  const [periodos, setPeriodos] = useState([])
  const [periodoActivo, setPeriodoActivo] = useState(null)
  const [periodoVisto, setPeriodoVisto] = useState(null)
  const [cargandoPeriodos, setCargandoPeriodos] = useState(true)

  const recargarPeriodos = useCallback(async () => {
    try {
      const lista = await getPeriodos()
      setPeriodos(lista)
      const activo = lista.find(p => p.estado === 'activo') ?? null
      setPeriodoActivo(activo)
      setPeriodoVisto(prev => prev ?? activo)
    } catch (err) {
      console.error('[PeriodoContext] Error al cargar períodos:', err)
    } finally {
      setCargandoPeriodos(false)
    }
  }, [])

  useEffect(() => { recargarPeriodos() }, [recargarPeriodos])

  async function handleCrear(datos) {
    await crearPeriodo(datos)
    await recargarPeriodos()
  }

  async function handleActivar(periodo) {
    await activarPeriodo(periodo.id)
    await recargarPeriodos()
  }

  async function handleCerrar(periodo) {
    await cerrarPeriodo(periodo.id)
    await recargarPeriodos()
  }

  // Últimos 5 períodos cerrados/archivados para historial
  const historial = [...periodos]
    .filter(p => p.estado === 'finalizado')
    .sort((a, b) => (b.fecha_fin ?? '').localeCompare(a.fecha_fin ?? ''))
    .slice(0, 5)

  return (
    <PeriodoContext.Provider value={{
      periodos,
      periodoActivo,
      periodoVisto,
      setPeriodoVisto,
      historial,
      cargandoPeriodos,
      recargarPeriodos,
      crearPeriodo: handleCrear,
      activarPeriodo: handleActivar,
      cerrarPeriodo: handleCerrar,
    }}>
      {children}
    </PeriodoContext.Provider>
  )
}
