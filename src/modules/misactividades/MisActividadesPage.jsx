import { useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  getActividades,
  crearActividad,
  actualizarActividad,
  moverActividad,
  eliminarActividad,
} from '../../services/misActividadesService'
import { useEffect } from 'react'
import KanbanColumna from './KanbanColumna'
import ActividadForm from './ActividadForm'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import PlanetCategoria from '../planet/PlanetCategoria'
import PlanetSemanaChart from '../planet/PlanetSemanaChart'
import { CATEGORIA_LABELS } from '../../utils/constants'

const COLUMNAS = [
  { estado: 'por_hacer',   label: 'Por hacer' },
  { estado: 'en_progreso', label: 'En progreso' },
  { estado: 'completada',  label: 'Completadas' },
]

export default function MisActividadesPage() {
  const { user } = useAuth()
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [vista, setVista]             = useState('tablero') // 'tablero' | 'estadisticas'
  const arrastandoId = useRef(null)
  const [columnaDestino, setColumnaDestino] = useState(null)

  const cargar = useCallback(async () => {
    if (!user?.uid) return
    const data = await getActividades(user.uid)
    setActividades(data)
    setCargando(false)
  }, [user?.uid])

  useEffect(() => { cargar() }, [cargar])

  async function handleCrear(datos) {
    setGuardando(true)
    await crearActividad(user.uid, datos)
    await cargar()
    setGuardando(false)
    setModalAbierto(false)
  }

  async function handleActualizar(id, datos) {
    await actualizarActividad(id, datos)
    await cargar()
  }

  async function handleEliminar(id) {
    await eliminarActividad(id)
    setActividades(prev => prev.filter(a => a.id !== id))
  }

  function handleDragStart(e, id) {
    arrastandoId.current = id
    e.dataTransfer.effectAllowed = 'move'
    const card = actividades.find(a => a.id === id)
    setColumnaDestino(card?.estado ?? null)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e, nuevoEstado) {
    e.preventDefault()
    const id = arrastandoId.current
    if (!id) return
    const actual = actividades.find(a => a.id === id)
    if (!actual || actual.estado === nuevoEstado) {
      setColumnaDestino(null)
      arrastandoId.current = null
      return
    }
    setActividades(prev => prev.map(a =>
      a.id === id
        ? { ...a, estado: nuevoEstado, fecha_completada: nuevoEstado === 'completada' ? new Date().toISOString() : null }
        : a
    ))
    setColumnaDestino(null)
    arrastandoId.current = null
    await moverActividad(id, nuevoEstado)
  }

  // Estadísticas derivadas del mismo estado `actividades`
  const stats = useMemo(() => {
    const total       = actividades.length
    const completadas = actividades.filter(a => a.estado === 'completada').length
    const enProgreso  = actividades.filter(a => a.estado === 'en_progreso').length
    const pct         = total > 0 ? Math.round(completadas / total * 100) : 0
    const porCategoria = Object.entries(CATEGORIA_LABELS).map(([cat, label]) => {
      const items        = actividades.filter(a => a.categoria_ces === cat)
      const completadasC = items.filter(a => a.estado === 'completada').length
      return { cat, label, total: items.length, completadas: completadasC }
    }).filter(c => c.total > 0)
    return { total, completadas, enProgreso, pct, porCategoria }
  }, [actividades])

  const actividadesFiltradas = filtroCategoria === 'todas'
    ? actividades
    : actividades.filter(a => a.categoria_ces === filtroCategoria)

  const porColumna = estado => actividadesFiltradas.filter(a => a.estado === estado)

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Mis Actividades</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''} en total
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle de vista */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setVista('tablero')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                vista === 'tablero' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tablero
            </button>
            <button
              onClick={() => setVista('estadisticas')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                vista === 'estadisticas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Estadísticas
            </button>
          </div>

          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-uide-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva
          </button>
        </div>
      </div>

      {/* Modal nueva actividad */}
      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Nueva actividad"
      >
        <ActividadForm
          onGuardar={handleCrear}
          onCancelar={() => setModalAbierto(false)}
          cargando={guardando}
        />
      </Modal>

      {cargando ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : vista === 'tablero' ? (
        <>
          {/* Filtro por categoría — solo en tablero */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFiltroCategoria('todas')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filtroCategoria === 'todas' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {Object.entries(CATEGORIA_LABELS).map(([valor, label]) => (
              <button
                key={valor}
                onClick={() => setFiltroCategoria(filtroCategoria === valor ? 'todas' : valor)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filtroCategoria === valor ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tablero Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 pb-4">
            {COLUMNAS.map(({ estado, label }) => (
              <KanbanColumna
                key={estado}
                estado={estado}
                label={label}
                tarjetas={porColumna(estado)}
                arrastrando={arrastandoId.current ? columnaDestino : null}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onActualizar={handleActualizar}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        </>
      ) : (
        /* Vista Estadísticas — mismos datos, sin fetch extra */
        <VistaEstadisticas stats={stats} actividades={actividades} />
      )}
    </div>
  )
}

function VistaEstadisticas({ stats, actividades }) {
  const { total, completadas, enProgreso, pct, porCategoria } = stats

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-500 font-medium">Sin actividades aún</p>
        <p className="text-gray-400 text-sm mt-1">Crea actividades en el Tablero para ver estadísticas aquí.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total"        valor={total}        color="text-gray-800" />
        <StatCard label="Por hacer"    valor={total - completadas - enProgreso} color="text-gray-500" />
        <StatCard label="En progreso"  valor={enProgreso}   color="text-blue-600" />
        <StatCard label="Completadas"  valor={completadas}  color="text-green-600" />
      </div>

      {/* Barra progreso global */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Progreso global</span>
          <span className="font-bold text-uide-primary">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-uide-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completadas} de {total} actividades completadas
        </p>
      </div>

      {/* Por categoría CES */}
      {porCategoria.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Por categoría CES</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {porCategoria.map(c => (
              <PlanetCategoria key={c.cat} {...c} />
            ))}
          </div>
        </div>
      )}

      {/* Gráfico semanal */}
      <PlanetSemanaChart actividades={actividades} />
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
