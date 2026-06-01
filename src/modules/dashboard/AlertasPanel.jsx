/**
 * Panel de alertas activas de incumplimiento.
 * Alertas generadas por useDashboard cuando porcentaje < UMBRAL_ALERTA_DEFAULT.
 * Referencia: HU-16, RN-011, RF-017.
 */
export default function AlertasPanel({ alertas = [] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Alertas activas</h3>
        {alertas.length > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            {alertas.length}
          </span>
        )}
      </div>

      {alertas.length === 0 ? (
        <div className="flex items-center gap-2 py-2">
          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </span>
          <p className="text-xs text-gray-500">Todos los docentes cumplen el umbral mínimo.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alertas.map(a => (
            <li key={a.id} className={`text-xs rounded-lg px-3 py-2.5 flex items-start gap-2 ${
              a.tipo === 'sin_distributivo'
                ? 'bg-gray-50 border border-gray-200 text-gray-700'
                : 'bg-red-50 border border-red-100 text-red-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                a.tipo === 'sin_distributivo' ? 'bg-gray-400' : 'bg-red-500'
              }`} />
              {a.mensaje}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
