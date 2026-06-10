import { UMBRAL_ALERTA_DEFAULT } from '../../utils/constants'

/**
 * Panel de configuración de parámetros globales del sistema.
 * Sprint 1: leer y escribir en Firestore /configuracion (solo admin).
 * Referencia: RN-011, RN-016.
 */
export default function ConfiguracionSistema({ config, _onGuardar }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-800">Configuración del sistema</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Umbral de alerta de cumplimiento (%)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              defaultValue={config?.umbral_alerta_cumplimiento ?? UMBRAL_ALERTA_DEFAULT}
              min={0} max={100}
              disabled
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <span className="text-xs text-gray-400">Sprint 1</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frecuencia de sincronización de calendarios
          </label>
          <select disabled className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed">
            <option>Diaria — Sprint 2</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" disabled defaultChecked={config?.notificaciones_activas ?? true}
            className="h-4 w-4 cursor-not-allowed" />
          <label className="text-sm text-gray-600">Notificaciones automáticas activas</label>
          <span className="text-xs text-gray-400">Sprint 5</span>
        </div>
      </div>
    </div>
  )
}
