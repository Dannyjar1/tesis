/**
 * Filtros para generación de reportes por período, docente y carrera.
 * Sprint 5: conectar con Firestore para cargar opciones dinámicas.
 * Referencia: RF-018, RN-007.
 */
export default function FiltrosReporte({ _filtros, _onChange }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Filtros del reporte</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Período</label>
          <select disabled className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed">
            <option>Sprint 5</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Docente</label>
          <select disabled className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed">
            <option>Sprint 5</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Carrera</label>
          <select disabled className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed">
            <option>Sprint 5</option>
          </select>
        </div>
      </div>
    </div>
  )
}
