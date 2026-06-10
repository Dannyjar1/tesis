import { useContext, useState } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useAuth } from '../auth/useAuth'
import { useDistributivo } from '../../hooks/useDistributivo'
import { ESTADO_COLORES, ESTADO_LABELS, TIPO_CONTRATO_HORAS, TIPO_CONTRATO_LABELS } from '../../utils/constants'
import { formatearFecha, formatearHoras } from '../../utils/formatters'
import DistributivoTable from './DistributivoTable'
import ResumenHoras from '../dashboard/ResumenHoras'
import PrevisualizacionPDF from '../reportes/PrevisualizacionPDF'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertBanner from '../../components/AlertBanner'
import { IconClipboard } from '../../components/icons'

export default function DistributivoPage() {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const { distributivo, cargando, error } = useDistributivo(periodoActivo?.id)
  const [previsualizando, setPrevisualizando] = useState(false)

  const horasContrato = distributivo
    ? (TIPO_CONTRATO_HORAS[distributivo.tipo_contrato] ?? 40)
    : 40
  const porcentaje = distributivo && horasContrato > 0
    ? Math.round((distributivo.total_horas / horasContrato) * 100)
    : 0

  if (cargando) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Distributivo</h1>
          <p className="text-gray-500 text-sm mt-0.5">{periodoActivo?.nombre ?? 'Período no configurado'}</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {distributivo && (
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORES[distributivo.estado]}`}>
              {ESTADO_LABELS[distributivo.estado]}
            </span>
          )}
          {distributivo && (
            <button
              onClick={() => setPrevisualizando(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-uide-primary border border-uide-primary/30 rounded-lg hover:bg-uide-light transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          )}
        </div>
      </div>

      {error && <AlertBanner tipo="error" mensaje={error} />}

      <PrevisualizacionPDF
        abierto={previsualizando}
        onCerrar={() => setPrevisualizando(false)}
        distributivo={distributivo}
        docente={{
          nombre_completo:     user?.nombre_completo,
          tipo_contrato:       distributivo?.tipo_contrato,
          carrera:             user?.carrera,
          categoria_escalafon: distributivo?.categoria_escalafon,
        }}
        periodo={periodoActivo}
        generadoPorNombre={user?.nombre_completo}
      />

      {!distributivo ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <IconClipboard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-700">Sin distributivo asignado</h2>
          <p className="text-gray-400 text-sm mt-1">
            El Director de Carrera aún no ha creado tu distributivo para el período activo.
          </p>
        </div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TarjetaStat label="Total horas/semana" valor={formatearHoras(distributivo.total_horas)} color="text-uide-primary" />
            <TarjetaStat label="Cumplimiento" valor={`${porcentaje}%`}
              color={porcentaje >= 80 ? 'text-green-600' : 'text-amber-600'} />
            <TarjetaStat label="Tipo de contrato"
              valor={TIPO_CONTRATO_LABELS[distributivo.tipo_contrato] ?? distributivo.tipo_contrato}
              color="text-gray-700" />
            <TarjetaStat label="Última actualización"
              valor={formatearFecha(distributivo.fecha_ultima_modificacion)}
              color="text-gray-500" small />
          </div>

          {/* Aprobación */}
          {distributivo.estado === 'aprobado' && distributivo.fecha_aprobacion && (
            <AlertBanner tipo="success"
              mensaje={`Distributivo aprobado el ${formatearFecha(distributivo.fecha_aprobacion)}`} />
          )}

          {distributivo.estado === 'borrador' && (
            <AlertBanner tipo="info"
              mensaje="Tu distributivo está en borrador. El Director de Carrera lo revisará y aprobará." />
          )}

          {/* Layout de dos columnas en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Desglose de actividades</h2>
              <DistributivoTable distributivo={distributivo} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">Resumen por categoría</h2>
              <ResumenHoras distributivo={distributivo} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TarjetaStat({ label, valor, color, small = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`${small ? 'text-base' : 'text-2xl'} font-bold mt-1 ${color}`}>{valor}</p>
    </div>
  )
}
