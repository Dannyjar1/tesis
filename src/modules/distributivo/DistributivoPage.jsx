import { useContext, useState } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useAuth } from '../auth/useAuth'
import { useDistributivo } from '../../hooks/useDistributivo'
import { ESTADO_COLORES, ESTADO_LABELS, ESTADOS_DISTRIBUTIVO, TIPO_CONTRATO_HORAS, TIPO_CONTRATO_LABELS } from '../../utils/constants'
import { formatearFecha, formatearHoras } from '../../utils/formatters'
import DistributivoTable from './DistributivoTable'
import CalendarioDistributivo from './CalendarioDistributivo'
import ResumenHoras from '../dashboard/ResumenHoras'
import PrevisualizacionPDF from '../reportes/PrevisualizacionPDF'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertBanner from '../../components/AlertBanner'
import { IconClipboard } from '../../components/icons'

export default function DistributivoPage() {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const { distributivo, cargando, error, confirmar, observar } = useDistributivo(periodoActivo?.id)
  const [previsualizando, setPrevisualizando] = useState(false)
  const [procesando, setProcesando]   = useState(false)
  const [accionError, setAccionError] = useState(null)
  const [mostrarObs, setMostrarObs]   = useState(false)
  const [obsTexto, setObsTexto]       = useState('')

  async function handleConfirmar() {
    setProcesando(true); setAccionError(null)
    try { await confirmar() }
    catch (err) { setAccionError(err.message) }
    finally { setProcesando(false) }
  }

  async function handleObservar() {
    if (!obsTexto.trim()) { setAccionError('La observación es obligatoria.'); return }
    setProcesando(true); setAccionError(null)
    try { await observar(obsTexto); setMostrarObs(false); setObsTexto('') }
    catch (err) { setAccionError(err.message) }
    finally { setProcesando(false) }
  }

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
          {distributivo.estado === ESTADOS_DISTRIBUTIVO.APROBADO && distributivo.fecha_aprobacion && (
            <AlertBanner tipo="success"
              mensaje={`Distributivo aprobado el ${formatearFecha(distributivo.fecha_aprobacion)} — confirmado por director y docente.`} />
          )}

          {/* Doble aprobación: el director aprobó, falta la confirmación del docente */}
          {distributivo.estado === ESTADOS_DISTRIBUTIVO.EN_REVISION && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-amber-900">Pendiente de tu confirmación</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  El Director de Carrera aprobó tu distributivo. Revísalo y confírmalo, o regístralo con una observación si algo no está correcto.
                </p>
              </div>
              {accionError && <p className="text-xs text-red-700">{accionError}</p>}
              {!mostrarObs ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleConfirmar} disabled={procesando}
                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-60">
                    {procesando ? 'Procesando…' : 'Confirmar distributivo'}
                  </button>
                  <button onClick={() => { setMostrarObs(true); setAccionError(null) }} disabled={procesando}
                    className="px-4 py-2 text-sm font-semibold text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition disabled:opacity-60">
                    Observar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea rows={3} value={obsTexto} onChange={e => setObsTexto(e.target.value)}
                    placeholder="Describe qué debe corregir el director…"
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setMostrarObs(false); setObsTexto(''); setAccionError(null) }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
                    <button onClick={handleObservar} disabled={procesando}
                      className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition disabled:opacity-60">
                      {procesando ? 'Enviando…' : 'Enviar observación'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {distributivo.estado === ESTADOS_DISTRIBUTIVO.BORRADOR && (
            <AlertBanner tipo="info"
              mensaje="Tu distributivo está en borrador. El Director de Carrera lo revisará y aprobará." />
          )}
          {distributivo.estado === ESTADOS_DISTRIBUTIVO.BORRADOR && distributivo.observacion_docente && (
            <AlertBanner tipo="warning"
              mensaje={`Observación registrada: ${distributivo.observacion_docente}`} />
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

      {/* Horario semanal — antes módulo /horario aparte, ahora sección del distributivo */}
      <div className="border-t border-gray-200 pt-6">
        <CalendarioDistributivo />
      </div>
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
