import { useContext } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'

/**
 * Selector del período académico activo para filtrar el distributivo.
 * Sprint 1: cargar períodos desde Firestore /periodos_academicos.
 * Referencia: RF-012.
 */
export default function PeriodoSelector({ onChange }) {
  const { periodoActivo } = useContext(PeriodoContext)

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm text-gray-600 font-medium">Período:</label>
      <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 cursor-not-allowed">
        {periodoActivo?.nombre ?? 'Sin período activo'}
      </div>
    </div>
  )
}
