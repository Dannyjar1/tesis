import { formatearHoras } from '../../utils/formatters'
import { calcularTotales, normalizarDistributivo } from '../distributivo/modeloDistributivo'

const BLOQUES = [
  { key: 'docencia',      label: '1. Docencia',                   color: 'bg-blue-100 text-blue-800' },
  { key: 'investigacion', label: '2. Investigación',             color: 'bg-purple-100 text-purple-800' },
  { key: 'vinculacion',   label: '3. Vinculación',               color: 'bg-green-100 text-green-800' },
  { key: 'gestion',       label: '4. Gestión Académica',         color: 'bg-orange-100 text-orange-800' },
]

/**
 * Resumen de horas por bloque del distributivo (estructura oficial de 4 bloques).
 * Usado en DistributivoPage (docente) y DashboardPage (director/coordinador).
 */
export default function ResumenHoras({ distributivo }) {
  const t = distributivo ? calcularTotales(normalizarDistributivo(distributivo)) : null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen por bloque</h3>
      <ul className="space-y-2">
        {BLOQUES.map(({ key, label, color }) => (
          <li key={key} className="flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
            <span className="font-semibold text-gray-700">{t ? formatearHoras(t[key]) : '—'}</span>
          </li>
        ))}
      </ul>
      {t && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs font-bold text-gray-800">
          <span>Total general</span>
          <span>{formatearHoras(t.total)}</span>
        </div>
      )}
    </div>
  )
}
