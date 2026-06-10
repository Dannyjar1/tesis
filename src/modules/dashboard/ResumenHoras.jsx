import { CATEGORIA_COLORES } from '../../utils/constants'
import { formatearHoras } from '../../utils/formatters'

const CATEGORIAS = [
  { key: 'horas_docencia_directa', label: 'Docencia directa',    cat: 'docencia' },
  { key: 'horas_preparacion',      label: 'Preparación y tutoría', cat: 'tutoria' },
  { key: 'horas_investigacion',    label: 'Investigación',        cat: 'investigacion' },
  { key: 'horas_vinculacion',      label: 'Vinculación',          cat: 'vinculacion' },
  { key: 'horas_gestion',          label: 'Gestión institucional', cat: 'gestion' },
]

/**
 * Resumen de horas asignadas por categoría del distributivo.
 * Usada en DistributivoPage (docente) y DashboardPage (director/coordinador).
 */
export default function ResumenHoras({ distributivo }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de horas</h3>
      <ul className="space-y-2">
        {CATEGORIAS.map(({ key, label, cat }) => (
          <li key={key} className="flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium ${CATEGORIA_COLORES[cat]}`}>
              {label}
            </span>
            <span className="font-semibold text-gray-700">
              {distributivo ? formatearHoras(distributivo[key]) : '—'}
            </span>
          </li>
        ))}
      </ul>
      {distributivo && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs font-bold text-gray-800">
          <span>Total</span>
          <span>{formatearHoras(distributivo.total_horas)}</span>
        </div>
      )}
    </div>
  )
}
