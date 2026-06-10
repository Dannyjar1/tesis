import { useState } from 'react'

/**
 * Hook para generación y descarga de reportes de cumplimiento.
 * Sprint 5: conectar con reportesService.generarReportePDF / generarReporteExcel.
 */
export function useReportes() {
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState(null)

  async function generarPDF(_filtros) {
    setGenerando(true)
    setError(null)
    try {
      // Sprint 5: await reportesService.generarReportePDF(_filtros)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerando(false)
    }
  }

  async function generarExcel(_filtros) {
    setGenerando(true)
    setError(null)
    try {
      // Sprint 5: await reportesService.generarReporteExcel(filtros)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerando(false)
    }
  }

  return { generando, error, generarPDF, generarExcel }
}
