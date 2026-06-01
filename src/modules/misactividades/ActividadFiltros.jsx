import { CATEGORIA_LABELS, CATEGORIA_COLORES } from '../../utils/constants'

const ESTADOS = [
  { valor: 'todas',      label: 'Todas' },
  { valor: 'pendiente',  label: 'Pendientes' },
  { valor: 'completada', label: 'Completadas' },
]

export default function ActividadFiltros({ filtroEstado, setFiltroEstado, filtroCategoria, setFiltroCategoria }) {
  return (
    <div className="space-y-3">
      {/* Filtro por estado */}
      <div className="flex gap-1.5 flex-wrap">
        {ESTADOS.map(({ valor, label }) => (
          <button
            key={valor}
            onClick={() => setFiltroEstado(valor)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtroEstado === valor
                ? 'bg-uide-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtro por categoría CES */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFiltroCategoria('todas')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filtroCategoria === 'todas'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Todas las categorías
        </button>
        {Object.entries(CATEGORIA_LABELS).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setFiltroCategoria(filtroCategoria === valor ? 'todas' : valor)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroCategoria === valor
                ? CATEGORIA_COLORES[valor]
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
