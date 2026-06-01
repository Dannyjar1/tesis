/**
 * Panel de estadísticas de retroalimentación al modelo BETO.
 * Muestra precision estimada, total clasificado y correcciones del docente.
 * Referencia: RN-010, RNF-009.
 */
export default function FeedbackPanel({ estadisticas }) {
  const { total = 0, correctas = 0, corregidas = 0, precision = 0 } = estadisticas ?? {}

  const colorPrecision = precision >= 80 ? 'text-green-600' : precision >= 60 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Retroalimentación al modelo</h3>

      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div>
          <p className="text-2xl font-bold text-uide-primary">{total}</p>
          <p className="text-xs text-gray-400 mt-0.5">Clasificados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{correctas}</p>
          <p className="text-xs text-gray-400 mt-0.5">Sin corregir</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-600">{corregidas}</p>
          <p className="text-xs text-gray-400 mt-0.5">Corregidos</p>
        </div>
      </div>

      {total > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Precisión estimada</span>
            <span className={`font-bold ${colorPrecision}`}>{precision}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                precision >= 80 ? 'bg-green-500' : precision >= 60 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${precision}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">Objetivo: ≥ 80% (RNF-009)</p>
        </div>
      )}

      {total === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          Aún no hay eventos clasificados.
        </p>
      )}
    </div>
  )
}
