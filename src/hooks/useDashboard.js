import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getDistributivosPorPeriodo,
  getDocentes,
} from '../services/distributivoService'
import { TIPOS_CONTRATO, UMBRAL_ALERTA_DEFAULT } from '../utils/constants'

export function useDashboard(periodoId, carreraId = null) {
  const [distributivos, setDistributivos] = useState([])
  const [docentes, setDocentes]           = useState([])
  const [cargando, setCargando]           = useState(true)
  const [ultimaActualizacion, setUltima]  = useState(null)
  const intervalRef = useRef(null)

  const cargar = useCallback(async () => {
    if (!periodoId) { setCargando(false); return }
    try {
      const [lista, docentesList] = await Promise.all([
        getDistributivosPorPeriodo(periodoId),
        getDocentes(carreraId),
      ])
      setDistributivos(lista)
      setDocentes(docentesList)
      setUltima(new Date())
    } catch {
      // silencioso — no romper el dashboard por un error de carga
    } finally {
      setCargando(false)
    }
  }, [periodoId, carreraId])

  useEffect(() => {
    cargar()
    // Polling cada 15 segundos — simula Firestore onSnapshot
    intervalRef.current = setInterval(cargar, 15000)
    return () => clearInterval(intervalRef.current)
  }, [cargar])

  // ── Métricas derivadas ────────────────────────────────────────────────────

  const docentesEnriquecidos = docentes.map(doc => {
    const dist = distributivos.find(d => d.docente_uid === doc.uid) ?? null
    const horasContrato = TIPOS_CONTRATO[doc.tipo_contrato]?.horas ?? 40
    const totalHoras = dist?.total_horas ?? 0
    const porcentaje = horasContrato > 0 ? Math.round((totalHoras / horasContrato) * 100) : 0

    return {
      ...doc,
      distributivo:          dist,
      horasContrato,
      totalHoras,
      porcentaje_cumplimiento: porcentaje,
      estado_distributivo:   dist?.estado ?? 'sin_distributivo',
    }
  })

  const aprobados   = distributivos.filter(d => d.estado === 'aprobado').length
  const borradores  = distributivos.filter(d => d.estado === 'borrador').length
  const sinAsignar  = docentes.length - distributivos.length
  const cumplimientoPromedio = docentesEnriquecidos.length > 0
    ? Math.round(docentesEnriquecidos.reduce((s, d) => s + d.porcentaje_cumplimiento, 0) / docentesEnriquecidos.length)
    : 0

  // Alertas generadas dinámicamente (RN-011, RN-016)
  const alertas = docentesEnriquecidos
    .filter(d => d.porcentaje_cumplimiento < UMBRAL_ALERTA_DEFAULT)
    .map(d => ({
      id:        `alerta-${d.uid}`,
      tipo:      d.distributivo ? 'bajo_cumplimiento' : 'sin_distributivo',
      docente:   d.nombre_completo,
      porcentaje: d.porcentaje_cumplimiento,
      mensaje:   d.distributivo
        ? `${d.nombre_completo} — cumplimiento al ${d.porcentaje_cumplimiento}% (umbral: ${UMBRAL_ALERTA_DEFAULT}%)`
        : `${d.nombre_completo} — sin distributivo asignado para el período activo`,
    }))

  // Datos para el gráfico de barras (Recharts)
  const datosGrafico = docentesEnriquecidos.map(d => ({
    nombre:     d.nombre_completo.split(' ').slice(-2).join(' '), // apellidos
    porcentaje: d.porcentaje_cumplimiento,
    contrato:   d.tipo_contrato,
  }))

  // Datos para el gráfico de distribución por categoría (PieChart)
  // Suma de horas de todos los distributivos aprobados
  const aprobadosLista = distributivos.filter(d => d.estado === 'aprobado')
  const categoriasTotales = aprobadosLista.length > 0 ? [
    { name: 'Docencia',       value: aprobadosLista.reduce((s, d) => s + (d.horas_docencia_directa ?? 0), 0), color: '#3B82F6' },
    { name: 'Investigación',  value: aprobadosLista.reduce((s, d) => s + (d.horas_investigacion ?? 0), 0),   color: '#8B5CF6' },
    { name: 'Vinculación',    value: aprobadosLista.reduce((s, d) => s + (d.horas_vinculacion ?? 0), 0),     color: '#10B981' },
    { name: 'Tutoría',        value: aprobadosLista.reduce((s, d) => s + (d.horas_tutoria ?? 0) + (d.horas_preparacion ?? 0), 0), color: '#F59E0B' },
    { name: 'Gestión',        value: aprobadosLista.reduce((s, d) => s + (d.horas_gestion ?? 0), 0),         color: '#F97316' },
  ].filter(c => c.value > 0) : []

  return {
    cargando,
    docentes: docentesEnriquecidos,
    distributivos,
    alertas,
    datosGrafico,
    categoriasTotales,
    stats: { aprobados, borradores, sinAsignar, cumplimientoPromedio, totalDocentes: docentes.length },
    ultimaActualizacion,
    recargar: cargar,
  }
}
