import { CATEGORIA_COLORES, CATEGORIA_LABELS } from '../../utils/constants'
import { formatearHoras } from '../../utils/formatters'

const FILAS = [
  { key: 'horas_docencia_directa', categoria: 'docencia', label: 'Docencia directa' },
  { key: 'horas_preparacion', categoria: 'tutoria', label: 'Preparación de clases' },
  { key: 'horas_tutoria', categoria: 'tutoria', label: 'Tutoría académica' },
  { key: 'horas_investigacion', categoria: 'investigacion', label: 'Investigación' },
  { key: 'horas_vinculacion', categoria: 'vinculacion', label: 'Vinculación con la Sociedad' },
  { key: 'horas_titulacion', categoria: 'docencia', label: 'Dirección/Tribunal titulación' },
  { key: 'horas_gestion', categoria: 'gestion', label: 'Gestión institucional' },
  { key: 'horas_reduccion_cargo', categoria: 'gestion', label: 'Reducción por cargo directivo' },
]

/**
 * Tabla de desglose de horas del distributivo por actividad y categoría.
 */
export default function DistributivoTable({ distributivo }) {
  if (!distributivo) return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
      <p className="text-gray-400 text-sm">No hay distributivo asignado para este período.</p>
    </div>
  )

  const total = distributivo.total_horas ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actividad</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría CES</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Horas/semana</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">% del total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {FILAS.map(({ key, categoria, label }) => {
            const horas = distributivo[key] ?? 0
            if (horas === 0) return null
            const pct = total > 0 ? Math.round((horas / total) * 100) : 0
            return (
              <tr key={key} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-medium">{label}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIA_COLORES[categoria]}`}>
                    {CATEGORIA_LABELS[categoria]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatearHoras(horas)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-uide-secondary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td colSpan={2} className="px-4 py-3 font-bold text-gray-800">TOTAL SEMANAL</td>
            <td className="px-4 py-3 text-right font-bold text-uide-primary">{formatearHoras(total)}</td>
            <td className="px-4 py-3 text-right font-bold text-gray-500">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
