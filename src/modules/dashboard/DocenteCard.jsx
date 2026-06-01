import { ESTADO_COLORES, ESTADO_LABELS, TIPOS_CONTRATO } from '../../utils/constants'
import { formatearPorcentaje, formatearHoras } from '../../utils/formatters'

/**
 * Tarjeta de cumplimiento individual por docente para el dashboard.
 * Referencia: HU-15, HU-17, RF-017.
 */
export default function DocenteCard({ docente }) {
  if (!docente) return null

  const {
    nombre_completo,
    tipo_contrato,
    porcentaje_cumplimiento,
    estado_distributivo,
    totalHoras,
    horasContrato,
    carrera,
  } = docente

  const bajo = (porcentaje_cumplimiento ?? 0) < 80
  const sinDist = estado_distributivo === 'sin_distributivo'

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
      bajo ? 'border-red-200' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{nombre_completo}</p>
          <p className="text-xs text-gray-400">{carrera}</p>
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
          sinDist
            ? 'bg-gray-100 text-gray-500'
            : (ESTADO_COLORES[estado_distributivo] ?? 'bg-gray-100 text-gray-600')
        }`}>
          {sinDist ? 'Sin asignar' : (ESTADO_LABELS[estado_distributivo] ?? '—')}
        </span>
      </div>

      {/* Barra de cumplimiento */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">
            {TIPOS_CONTRATO[tipo_contrato]?.nombre ?? tipo_contrato}
            <span className="text-gray-400 ml-1">({horasContrato}h)</span>
          </span>
          <span className={`font-bold ${bajo ? 'text-red-600' : 'text-green-600'}`}>
            {sinDist ? '—' : formatearPorcentaje(porcentaje_cumplimiento)}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              sinDist ? 'w-0' : bajo ? 'bg-red-400' : 'bg-green-400'
            }`}
            style={{ width: sinDist ? '0%' : `${Math.min(porcentaje_cumplimiento, 100)}%` }}
          />
        </div>
        {!sinDist && (
          <p className="text-xs text-gray-400 text-right">
            {formatearHoras(totalHoras)} / {horasContrato}h semana
          </p>
        )}
      </div>
    </div>
  )
}
