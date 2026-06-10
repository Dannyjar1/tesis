import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/useAuth'
import { ROLES, ROL_LABELS, TIPO_CONTRATO_LABELS, CARRERA_LABELS } from '../../utils/constants'
import { getPersonal, crearPersonal, actualizarPersonal, toggleActivo } from '../../services/personalService'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import DocenteForm from './DocenteForm'
import { IconUsuarios } from '../../components/icons'

const CONTRATO_BADGE = {
  tiempo_completo: 'bg-blue-100 text-blue-700',
  medio_tiempo:    'bg-teal-100 text-teal-700',
  tiempo_parcial:  'bg-orange-100 text-orange-700',
  honorario:       'bg-purple-100 text-purple-700',
}

export default function PersonalPage() {
  const { user } = useAuth()
  const esDirector = user?.rol === ROLES.DIRECTOR
  const carreraId  = user?.carrera_id

  const [personal, setPersonal]       = useState([])
  const [cargando, setCargando]       = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando]       = useState(null)   // usuario a editar o null
  const [guardando, setGuardando]     = useState(false)

  const cargar = useCallback(async () => {
    if (!carreraId) { setCargando(false); return }
    try {
      const data = await getPersonal(carreraId)
      setPersonal(data)
    } catch (err) {
      console.error('[PersonalPage] Error al cargar personal:', err)
    } finally {
      setCargando(false)
    }
  }, [carreraId])

  useEffect(() => { cargar() }, [cargar])

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const stats = {
    total:    personal.length,
    activos:  personal.filter(p => p.activo).length,
    tc:       personal.filter(p => p.tipo_contrato === 'tiempo_completo').length,
    mt:       personal.filter(p => p.tipo_contrato === 'medio_tiempo').length,
    tp:       personal.filter(p => p.tipo_contrato === 'tiempo_parcial' || p.tipo_contrato === 'honorario').length,
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleGuardar(datos) {
    setGuardando(true)
    if (editando) {
      await actualizarPersonal(carreraId, editando.uid, datos)
    } else {
      await crearPersonal(carreraId, datos)
    }
    await cargar()
    setGuardando(false)
    setModalAbierto(false)
    setEditando(null)
  }

  function abrirCrear() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(p) {
    setEditando(p)
    setModalAbierto(true)
  }

  async function handleToggleActivo(p) {
    const accion = p.activo ? 'desactivar' : 'activar'
    if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${p.nombre_completo}?`)) return
    await toggleActivo(carreraId, p.uid)
    await cargar()
  }

  const nombreCarrera = CARRERA_LABELS[carreraId] ?? carreraId

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Mi Personal</h1>
          <p className="text-gray-400 text-sm mt-0.5">{nombreCarrera}</p>
        </div>
        {esDirector && (
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-uide-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal
        abierto={modalAbierto}
        onCerrar={() => { setModalAbierto(false); setEditando(null) }}
        titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      >
        <DocenteForm
          inicial={editando}
          onGuardar={handleGuardar}
          onCancelar={() => { setModalAbierto(false); setEditando(null) }}
          cargando={guardando}
        />
      </Modal>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"           valor={stats.total}   color="text-gray-800" />
        <StatCard label="Tiempo completo" valor={stats.tc}      color="text-blue-600" />
        <StatCard label="Medio tiempo"    valor={stats.mt}      color="text-teal-600" />
        <StatCard label="Parcial / Hon."  valor={stats.tp}      color="text-purple-600" />
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : personal.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <IconUsuarios className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Sin personal registrado</p>
          {esDirector && (
            <p className="text-gray-400 text-sm mt-1">
              Usa el botón "Nuevo usuario" para añadir docentes a tu carrera.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Correo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Contrato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                {esDirector && (
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {personal.map(p => (
                <tr key={p.uid} className={`hover:bg-gray-50 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                  {/* Nombre + inicial */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-uide-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {p.nombre_completo.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[160px]">{p.nombre_completo}</span>
                    </div>
                  </td>

                  {/* Correo */}
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.email}</td>

                  {/* Cargo */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-600">
                      {ROL_LABELS[p.rol] ?? p.rol}
                    </span>
                  </td>

                  {/* Tipo contrato */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.tipo_contrato ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${CONTRATO_BADGE[p.tipo_contrato] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TIPO_CONTRATO_LABELS[p.tipo_contrato]?.split(' — ')[0]}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.activo ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones — solo Director */}
                  {esDirector && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirEditar(p)}
                          title="Editar"
                          className="p-1.5 text-gray-400 hover:text-uide-primary hover:bg-blue-50 rounded-lg transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActivo(p)}
                          title={p.activo ? 'Desactivar' : 'Activar'}
                          className={`p-1.5 rounded-lg transition ${
                            p.activo
                              ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {p.activo ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer con nota de solo lectura para coordinador */}
          {!esDirector && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                Vista de solo lectura — contacta al Director de Carrera para modificar usuarios.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
