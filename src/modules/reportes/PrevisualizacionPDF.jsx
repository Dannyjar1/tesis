import { useState } from 'react'
import Modal from '../../components/Modal'
import DistributivoTable from '../distributivo/DistributivoTable'
import { exportarDistributivoPDF } from '../../utils/exportPDF'
import { TIPOS_CONTRATO } from '../../utils/constants'
import { formatearFecha } from '../../utils/formatters'

/**
 * Modal de previsualización obligatoria antes de descarga PDF (RN-025).
 * Muestra la tabla del distributivo y permite al docente confirmar y descargar.
 */
export default function PrevisualizacionPDF({
  abierto,
  onCerrar,
  distributivo,
  docente,
  periodo,
  generadoPorNombre,
}) {
  const [descargando, setDescargando] = useState(false)
  const [codigoGenerado, setCodigoGenerado] = useState(null)

  const horasContrato = TIPOS_CONTRATO[distributivo?.tipo_contrato]?.horas ?? 40
  const cumplimiento  = distributivo
    ? Math.round((distributivo.total_horas / horasContrato) * 100)
    : 0

  async function handleDescargar() {
    setDescargando(true)
    try {
      const codigo = await exportarDistributivoPDF(distributivo, docente, periodo, generadoPorNombre)
      setCodigoGenerado(codigo)
    } catch (err) {
      console.error('Error generando PDF:', err)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Previsualización del distributivo"
      ancho="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Datos del docente y período */}
        <div className="bg-uide-light rounded-xl px-4 py-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Docente</p>
            <p className="font-semibold text-uide-primary">{docente?.nombre_completo ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {TIPOS_CONTRATO[distributivo?.tipo_contrato]?.nombre ?? '—'} · {horasContrato}h/semana
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Período</p>
            <p className="font-semibold text-gray-800">{periodo?.nombre ?? '—'}</p>
            {periodo?.fecha_inicio && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatearFecha(periodo.fecha_inicio)} — {formatearFecha(periodo.fecha_fin)}
              </p>
            )}
          </div>
        </div>

        {/* Resumen cumplimiento */}
        <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex-1">
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${cumplimiento >= 100 ? 'bg-green-500' : cumplimiento >= 80 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(cumplimiento, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${cumplimiento >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
              {distributivo?.total_horas ?? 0}h / {horasContrato}h
            </p>
            <p className="text-xs text-gray-400">Cumplimiento {cumplimiento}%</p>
          </div>
        </div>

        {/* Tabla del distributivo */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Revisa el desglose antes de descargar:</p>
          <div className="max-h-[360px] overflow-y-auto rounded-xl border border-gray-200">
            <DistributivoTable distributivo={distributivo} />
          </div>
        </div>

        {codigoGenerado && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-2 rounded-lg">
            PDF descargado · Código de verificación: <strong>{codigoGenerado}</strong>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleDescargar}
            disabled={descargando || !distributivo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-uide-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {descargando ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando PDF…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Confirmar y descargar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
