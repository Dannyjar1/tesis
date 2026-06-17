import { CATEGORIA_LABELS, ESTADOS_ACTIVIDAD } from '../../utils/constants'
import { estadoEfectivo } from '../../services/actividadesService'

/**
 * ProgresoCategoria — Indicadores de progreso por categoría CES
 * (PROJECT_BRIEF §15.3). Una barra por cada categoría con al menos una
 * actividad asignada: completadas / total + porcentaje. Se alimenta del MISMO
 * array que el listado (sin fetch adicional, RN-027).
 */
export default function ProgresoCategoria({ actividades = [] }) {
  const categorias = [...new Set(actividades.map(a => a.categoria_ces))]
    .map(cat => {
      const delCat = actividades.filter(a => a.categoria_ces === cat)
      const completadas = delCat.filter(a => estadoEfectivo(a) === ESTADOS_ACTIVIDAD.COMPLETADA).length
      const total = delCat.length
      return { cat, total, completadas, pct: total ? Math.round((completadas / total) * 100) : 0 }
    })
    .sort((a, b) => a.cat.localeCompare(b.cat))

  if (categorias.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">Progreso por categoría</h2>
      <div className="space-y-2.5">
        {categorias.map(({ cat, total, completadas, pct }) => (
          <div key={cat}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700">{CATEGORIA_LABELS[cat] ?? cat}</span>
              <span className="text-gray-500 font-medium tabular-nums">{completadas}/{total} · {pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-uide-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
