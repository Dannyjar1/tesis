import { useState, useContext } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useAuth } from '../auth/useAuth'
import { useGestionDistributivos } from '../../hooks/useDistributivo'
import { ESTADO_COLORES, ESTADO_LABELS, ROLES, TIPO_CONTRATO_HORAS, TIPO_CONTRATO_LABELS, CARRERA_LABELS } from '../../utils/constants'
import { formatearHoras } from '../../utils/formatters'
import DistributivoForm from './DistributivoForm'
import DistributivoTable from './DistributivoTable'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertBanner from '../../components/AlertBanner'

export default function GestionDistributivoPage() {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const { distributivos, docentes, cargando, error, recargar, crear, actualizar, aprobar } =
    useGestionDistributivos(periodoActivo?.id)

  const [modalForm, setModalForm] = useState(null)   // { docente, distributivo|null }
  const [modalDetalle, setModalDetalle] = useState(null)
  const [alerta, setAlerta] = useState(null)
  const [procesando, setProcesando] = useState(false)

  const esDirector = user?.rol === ROLES.DIRECTOR

  function getDistributivoDeDocente(uid) {
    return distributivos.find(d => d.docente_uid === uid) ?? null
  }

  async function handleGuardarForm(datos) {
    const existente = getDistributivoDeDocente(datos.docente_uid)
    if (existente) {
      await actualizar(existente.id, datos)
      setAlerta({ tipo: 'success', msg: 'Distributivo actualizado correctamente.' })
    } else {
      await crear(datos)
      setAlerta({ tipo: 'success', msg: 'Distributivo creado en estado borrador.' })
    }
    setModalForm(null)
  }

  async function handleAprobar(docente, dist) {
    setProcesando(true)
    setAlerta(null)
    try {
      const horasContrato = TIPO_CONTRATO_HORAS[docente.tipo_contrato] ?? 40
      await aprobar(dist.id, horasContrato)
      setAlerta({ tipo: 'success', msg: `Distributivo de ${docente.nombre_completo} aprobado correctamente.` })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setProcesando(false)
    }
  }

  const aprobados = distributivos.filter(d => d.estado === 'aprobado').length
  const borradores = distributivos.filter(d => d.estado === 'borrador').length
  const sinAsignar = docentes.length - distributivos.length

  if (cargando) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión del Distributivo</h1>
          <p className="text-gray-500 text-sm mt-0.5">{periodoActivo?.nombre}</p>
        </div>
      </div>

      {alerta && (
        <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />
      )}
      {error && <AlertBanner tipo="error" mensaje={error} />}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total docentes" valor={docentes.length} color="text-uide-primary" />
        <StatCard label="Aprobados" valor={aprobados} color="text-green-600" />
        <StatCard label="En borrador" valor={borradores} color="text-amber-600" />
        <StatCard label="Sin asignar" valor={sinAsignar} color="text-gray-500" />
      </div>

      {/* Tabla de docentes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Docente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Contrato</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Total</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docentes.map(docente => {
              const dist = getDistributivoDeDocente(docente.uid)
              const horasContrato = TIPO_CONTRATO_HORAS[docente.tipo_contrato] ?? 40
              const puedeAprobar = esDirector && dist && dist.estado === 'borrador'
              return (
                <tr key={docente.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{docente.nombre_completo}</p>
                    <p className="text-xs text-gray-400">{CARRERA_LABELS[docente.carrera_id] ?? docente.carrera_id ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                      {TIPO_CONTRATO_LABELS[docente.tipo_contrato] ?? docente.tipo_contrato} ({horasContrato}h)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {dist ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_COLORES[dist.estado]}`}>
                        {ESTADO_LABELS[dist.estado]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-2 py-1 rounded-full">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700 hidden md:table-cell">
                    {dist ? formatearHoras(dist.total_horas) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {dist && (
                        <button
                          onClick={() => setModalDetalle(dist)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                        >
                          Ver
                        </button>
                      )}
                      {esDirector && (
                        <button
                          onClick={() => setModalForm({ docente, distributivo: dist })}
                          className="text-xs text-uide-secondary hover:text-uide-primary px-2 py-1 rounded hover:bg-uide-light transition"
                        >
                          {dist ? 'Editar' : 'Crear'}
                        </button>
                      )}
                      {puedeAprobar && (
                        <button
                          onClick={() => handleAprobar(docente, dist)}
                          disabled={procesando}
                          className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded transition disabled:opacity-60"
                        >
                          {procesando ? '...' : 'Aprobar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal formulario */}
      {modalForm && (
        <Modal
          abierto
          onCerrar={() => setModalForm(null)}
          titulo={modalForm.distributivo ? `Editar distributivo — ${modalForm.docente.nombre_completo}` : `Crear distributivo — ${modalForm.docente.nombre_completo}`}
          ancho="max-w-2xl"
        >
          <DistributivoForm
            docente={modalForm.docente}
            periodoId={periodoActivo?.id}
            distributivoExistente={modalForm.distributivo}
            onGuardar={handleGuardarForm}
            onCancelar={() => setModalForm(null)}
          />
        </Modal>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <Modal
          abierto
          onCerrar={() => setModalDetalle(null)}
          titulo="Detalle del distributivo"
          ancho="max-w-2xl"
        >
          <DistributivoTable distributivo={modalDetalle} />
        </Modal>
      )}
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
      <p className={`text-3xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
