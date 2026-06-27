import { useState, useContext, useEffect } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useAuth } from '../auth/useAuth'
import {
  generarReportePDFIndividual,
  generarReportePDFCarrera,
  generarReporteExcel,
  getHistorialReportes,
} from '../../services/reportesService'
import ReporteSemestralModal from './ReporteSemestralModal'
import { getDocentes } from '../../services/distributivoService'
import { formatearFecha } from '../../utils/formatters'
import AlertBanner from '../../components/AlertBanner'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ReportesPage() {
  const { user }          = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const [docentes, setDocentes] = useState([])

  useEffect(() => {
    getDocentes(user?.carrera_id ?? null).then(setDocentes)
  }, [user?.carrera_id])

  const [tipoReporte, setTipoReporte] = useState('carrera')   // 'carrera' | 'individual'
  const [docenteSelec, setDocenteSelec] = useState('')
  const [generando, setGenerando]     = useState(false)
  const [alerta, setAlerta]           = useState(null)
  const [historial, setHistorial]     = useState([])
  const [cargandoHist, setCargandoHist] = useState(true)
  const [modalSemestral, setModalSemestral] = useState(false)

  useEffect(() => {
    if (!user) return
    getHistorialReportes(user.uid)
      .then(setHistorial)
      .finally(() => setCargandoHist(false))
  }, [user])

  async function recargarHistorial() {
    if (!user) return
    setHistorial(await getHistorialReportes(user.uid))
  }

  async function handleGenerarPDF() {
    setAlerta(null)
    setGenerando(true)
    try {
      const filtros = {
        periodoId:         periodoActivo?.id,
        generadoPorUid:    user?.uid,
        generadoPorNombre: user?.nombre_completo,
        periodo:           periodoActivo,
      }
      let codigo
      if (tipoReporte === 'individual') {
        if (!docenteSelec) { setAlerta({ tipo: 'error', msg: 'Selecciona un docente.' }); return }
        codigo = await generarReportePDFIndividual({ ...filtros, docenteUid: docenteSelec })
      } else {
        codigo = await generarReportePDFCarrera(filtros)
      }
      setAlerta({ tipo: 'success', msg: `PDF generado. Código de verificación: ${codigo}` })
      await recargarHistorial()
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setGenerando(false)
    }
  }

  async function handleGenerarExcel() {
    setAlerta(null)
    setGenerando(true)
    try {
      await generarReporteExcel({
        periodoId:      periodoActivo?.id,
        generadoPorUid: user?.uid,
        periodo:        periodoActivo,
      })
      setAlerta({ tipo: 'success', msg: 'Archivo Excel generado y descargado correctamente.' })
      await recargarHistorial()
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setGenerando(false)
    }
  }

  async function handleSemestralGenerado(codigo) {
    setAlerta({ tipo: 'success', msg: `Reporte semestral de actividades generado. Código de verificación: ${codigo}` })
    await recargarHistorial()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Exportación</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {periodoActivo?.nombre} — Reportes listos para acreditación CACES
        </p>
      </div>

      {alerta && (
        <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de generación */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tipo de reporte */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Configurar reporte</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'carrera',    label: 'Reporte de carrera', desc: 'Todos los docentes del período' },
                { id: 'individual', label: 'Reporte individual', desc: 'Un docente específico' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTipoReporte(opt.id)}
                  className={`text-left p-3 rounded-lg border transition ${
                    tipoReporte === opt.id
                      ? 'border-uide-primary bg-uide-light'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${tipoReporte === opt.id ? 'text-uide-primary' : 'text-gray-700'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Selector de docente (solo individual) */}
            {tipoReporte === 'individual' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Seleccionar docente
                </label>
                <select
                  value={docenteSelec}
                  onChange={e => setDocenteSelec(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
                >
                  <option value="">— Selecciona un docente —</option>
                  {docentes.map(d => (
                    <option key={d.uid} value={d.uid}>{d.nombre_completo} ({d.tipo_contrato})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Período (solo lectura) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                {periodoActivo?.nombre ?? 'Sin período activo'}
              </div>
            </div>

            {/* Botones de descarga */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleGenerarPDF}
                disabled={generando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-uide-primary hover:bg-uide-dark rounded-lg transition disabled:opacity-60"
              >
                {generando ? <LoadingSpinnerInline /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                )}
                Descargar PDF
              </button>
              <button
                onClick={handleGenerarExcel}
                disabled={generando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-60"
              >
                {generando ? <LoadingSpinnerInline /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                )}
                Descargar Excel
              </button>
            </div>

            {/* Reporte semestral de cumplimiento de actividades (con evidencias) */}
            <button
              onClick={() => setModalSemestral(true)}
              disabled={generando}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-uide-primary border border-uide-primary/30 hover:bg-uide-light rounded-lg transition disabled:opacity-60"
            >
              {generando ? <LoadingSpinnerInline /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
              )}
              Reporte semestral de actividades (cumplimiento + evidencias)
            </button>
          </div>

          {/* Historial de reportes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Historial de reportes generados</h2>
            </div>
            {cargandoHist ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : historial.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400">Aún no se han generado reportes.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historial.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.tipo.includes('excel') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {r.tipo.includes('individual') ? 'PDF Individual' : r.tipo.includes('excel') ? 'Excel' : 'PDF Carrera'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.periodo_id}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono hidden sm:table-cell">
                        {r.codigo_verificacion?.slice(0, 24)}…
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatearFecha(r.fecha_generacion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar informativo */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">¿Qué incluye el reporte?</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              {[
                'Datos del docente y tipo de contrato',
                'Distribución de horas por categoría CES 2021',
                'Validación de la suma total de horas',
                'Estado de aprobación del distributivo',
                'Firma de auditoría con fecha y hora',
                'Código de verificación único (RN-017)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-uide-light border border-uide-secondary/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-uide-primary mb-1">Acreditación CACES</p>
            <p className="text-xs text-gray-600">
              Los reportes PDF incluyen código de verificación único y firma de auditoría, cumpliendo con los requisitos de evidencia documental para procesos de acreditación.
            </p>
          </div>
        </div>
      </div>

      <ReporteSemestralModal
        abierto={modalSemestral}
        onCerrar={() => setModalSemestral(false)}
        periodo={periodoActivo}
        carreraId={user?.carrera_id ?? null}
        user={user}
        onGenerado={handleSemestralGenerado}
      />
    </div>
  )
}

function LoadingSpinnerInline() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}
