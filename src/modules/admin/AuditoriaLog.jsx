import { formatearFecha } from '../../utils/formatters'

const ACCION_LABELS = {
  aprobar_distributivo: 'Aprobar distributivo',
  crear_distributivo:   'Crear distributivo',
  editar_distributivo:  'Editar distributivo',
  crear_periodo:        'Crear período',
  cerrar_periodo:       'Cerrar período',
  crear_usuario:        'Crear usuario',
  desactivar_usuario:   'Desactivar usuario',
}

/**
 * Historial cronológico de cambios al sistema (colección /auditoria).
 * Referencia: RF-021, RN-015, HU-20.
 */
export default function AuditoriaLog({ registros = [] }) {
  if (registros.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-400">Sin registros de auditoría disponibles.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-xs min-w-[640px]">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Campo</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Antes</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Después</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {registros.map(r => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatearFecha(r.timestamp)}</td>
              <td className="px-4 py-3 text-gray-700 font-medium">{r.usuario_nombre ?? r.usuario_uid}</td>
              <td className="px-4 py-3">
                <span className="bg-uide-light text-uide-primary px-2 py-0.5 rounded-full font-medium">
                  {ACCION_LABELS[r.accion] ?? r.accion}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 font-mono">{r.campo_modificado ?? '—'}</td>
              <td className="px-4 py-3 text-red-600 font-mono">{r.valor_anterior != null ? String(r.valor_anterior) : '—'}</td>
              <td className="px-4 py-3 text-green-700 font-mono font-medium">{r.valor_nuevo != null ? String(r.valor_nuevo) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
