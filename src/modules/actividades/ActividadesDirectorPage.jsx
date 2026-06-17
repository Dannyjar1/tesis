import { useState, useEffect, useContext, useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import { PeriodoContext } from '../../context/PeriodoContext'
import { usePermisos } from '../../hooks/usePermisos'
import { useGestionDistributivos } from '../../hooks/useDistributivo'
import {
  suscribirseActividades, ampliarPlazo, estadoEfectivo,
} from '../../services/actividadesService'
import {
  CATEGORIAS, CATEGORIA_LABELS, ESTADOS_ACTIVIDAD, ESTADO_ACTIVIDAD_LABELS,
} from '../../utils/constants'
import ActividadCard from './ActividadCard'
import NuevaActividadModal from './NuevaActividadModal'
import Modal from '../../components/Modal'
import AlertBanner from '../../components/AlertBanner'
import LoadingSpinner from '../../components/LoadingSpinner'

/**
 * ActividadesDirectorPage — Panel del director (PROJECT_BRIEF §16).
 * Resumen global + filtros (docente, categoría, estado) + listado de las
 * actividades asignadas a sus docentes, con asignación de nuevas y ampliación
 * de plazo (observación obligatoria, §5.4).
 */
export default function ActividadesDirectorPage() {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const { tieneAccion } = usePermisos()
  const carreraId = user?.carrera_id ?? null
  const { docentes } = useGestionDistributivos(periodoActivo?.id, carreraId)

  const [actividades, setActividades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fDocente, setFDocente] = useState('')
  const [fCategoria, setFCategoria] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [modalNueva, setModalNueva] = useState(false)
  const [modalAmpliar, setModalAmpliar] = useState(null)

  const puedeCrear = tieneAccion('actividades', 'crear')

  function cargar() {
    if (!periodoActivo?.id) { setCargando(false); return () => {} }
    setCargando(true)
    return suscribirseActividades(
      { periodoId: periodoActivo.id, carreraId },
      lista => { setActividades(lista); setCargando(false) },
    )
  }

  useEffect(() => {
    const unsub = cargar()
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoActivo?.id, carreraId])

  const visibles = useMemo(() => actividades.filter(a =>
    (!fDocente   || a.asignada_a_uid === fDocente) &&
    (!fCategoria || a.categoria_ces === fCategoria) &&
    (!fEstado    || estadoEfectivo(a) === fEstado)
  ), [actividades, fDocente, fCategoria, fEstado])

  const resumen = useMemo(() => {
    const total = actividades.length
    const completadas = actividades.filter(a => estadoEfectivo(a) === ESTADOS_ACTIVIDAD.COMPLETADA).length
    const vencidas = actividades.filter(a => estadoEfectivo(a) === ESTADOS_ACTIVIDAD.VENCIDA).length
    return { total, completadas, vencidas, pct: total ? Math.round((completadas / total) * 100) : 0 }
  }, [actividades])

  if (cargando) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividades asignadas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{periodoActivo?.nombre ?? 'Sin período activo'}</p>
        </div>
        {puedeCrear && (
          <button
            onClick={() => setModalNueva(true)}
            className="text-sm font-medium bg-uide-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            + Nueva actividad
          </button>
        )}
      </div>

      {/* Resumen global */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total asignadas" valor={resumen.total} color="text-uide-primary" />
        <StatCard label="Completadas" valor={resumen.completadas} color="text-green-600" />
        <StatCard label="Vencidas" valor={resumen.vencidas} color="text-red-600" />
        <StatCard label="% completado" valor={`${resumen.pct}%`} color="text-gray-700" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select value={fDocente} onChange={e => setFDocente(e.target.value)} className={selCls}>
          <option value="">Todos los docentes</option>
          {docentes.map(d => <option key={d.uid} value={d.uid}>{d.nombre_completo ?? d.nombre}</option>)}
        </select>
        <select value={fCategoria} onChange={e => setFCategoria(e.target.value)} className={selCls}>
          <option value="">Todas las categorías</option>
          {Object.values(CATEGORIAS).map(c => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
        </select>
        <select value={fEstado} onChange={e => setFEstado(e.target.value)} className={selCls}>
          <option value="">Todos los estados</option>
          {Object.values(ESTADOS_ACTIVIDAD).map(e => <option key={e} value={e}>{ESTADO_ACTIVIDAD_LABELS[e]}</option>)}
        </select>
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-8 text-center">No hay actividades que coincidan con los filtros.</p>
      ) : (
        <div className="space-y-3">
          {visibles.map(act => (
            <ActividadCard key={act.id} actividad={act} modo="director" onAmpliarPlazo={setModalAmpliar} />
          ))}
        </div>
      )}

      {modalNueva && (
        <NuevaActividadModal
          docentes={docentes}
          periodoId={periodoActivo?.id}
          asignadaPor={user}
          onCreada={cargar}
          onCerrar={() => setModalNueva(false)}
        />
      )}

      {modalAmpliar && (
        <AmpliarPlazoModal
          actividad={modalAmpliar}
          onConfirmar={async (fecha, obs) => {
            const actualizada = await ampliarPlazo(modalAmpliar, fecha, obs)
            setActividades(prev => prev.map(a => a.id === actualizada.id ? actualizada : a))
          }}
          onCerrar={() => setModalAmpliar(null)}
        />
      )}
    </div>
  )
}

const selCls = 'border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary'

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-[11px] text-gray-400 mt-1">{label}</p>
    </div>
  )
}

/** Modal de ampliación de plazo con observación obligatoria (§5.4). */
function AmpliarPlazoModal({ actividad, onConfirmar, onCerrar }) {
  const [fecha, setFecha] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function handle(e) {
    e.preventDefault()
    setError(null)
    if (!fecha) return setError('Indica la nueva fecha límite.')
    if (!obs.trim()) return setError('La observación es obligatoria.')
    setGuardando(true)
    try {
      await onConfirmar(fecha, obs)
      onCerrar()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Ampliar plazo — ${actividad.titulo}`}>
      <form onSubmit={handle} className="space-y-3">
        {error && <AlertBanner tipo="error" mensaje={error} onCerrar={() => setError(null)} />}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nueva fecha límite *</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={selCls + ' w-full'} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Observación / justificación *</label>
          <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} placeholder="Motivo de la ampliación de plazo…" className={selCls + ' w-full'} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button type="submit" disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90 disabled:opacity-60">
            {guardando ? 'Guardando…' : 'Ampliar plazo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
