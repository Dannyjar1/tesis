import { CATEGORIA_COLORES } from '../../utils/constants'

// Maps Tailwind bg-X-100 → bg-X-400 for the progress bar fill
const COLOR_BARRA = {
  'bg-blue-100 text-blue-800':     'bg-blue-500',
  'bg-purple-100 text-purple-800': 'bg-purple-500',
  'bg-green-100 text-green-800':   'bg-green-500',
  'bg-yellow-100 text-yellow-800': 'bg-yellow-500',
  'bg-orange-100 text-orange-800': 'bg-orange-500',
}

export default function PlanetCategoria({ cat, label, total, completadas }) {
  const pct        = total > 0 ? Math.round(completadas / total * 100) : 0
  const badgeClass = CATEGORIA_COLORES[cat] ?? 'bg-gray-100 text-gray-700'
  const barraClass = COLOR_BARRA[badgeClass] ?? 'bg-uide-primary'
  const pendientes = total - completadas

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${badgeClass}`}>
          {label}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">{total} tarea{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barraClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{completadas} completada{completadas !== 1 ? 's' : ''}</span>
        <span className="font-semibold text-gray-700">{pct}%</span>
      </div>

      {pendientes > 0 && (
        <p className="text-[11px] text-gray-400 mt-1.5">
          {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
