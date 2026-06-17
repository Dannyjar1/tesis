import { useEffect, useState, useContext } from 'react'
import { useAuth } from '../auth/useAuth'
import { PeriodoContext } from '../../context/PeriodoContext'
import {
  getPlanesMejora, crearPlanMejora, actualizarEstadoPlan,
} from '../../services/planesMejoraService'
import { formatearFecha } from '../../utils/formatters'
import Modal from '../../components/Modal'
import AlertBanner from '../../components/AlertBanner'
import { IconClipboard } from '../../components/icons'

const ESTADO_PLAN = {
  abierto:     'bg-amber-100 text-amber-800',
  cumplido:    'bg-green-100 text-green-800',
  incumplido:  'bg-red-100 text-red-800',
}

/**
 * PlanesMejoraPanel — Planes de mejora por incumplimiento (RF-037).
 * El director registra un plan accionable (descripción, fecha compromiso,
 * responsable) para docentes que no cumplen sus horas, y da seguimiento.
 */
export default function PlanesMejoraPanel({ docentes }) {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)
  const [planes, setPlanes]   = useState([])
  const [abierto, setAbierto] = useState(false)
  const [alerta, setAlerta]   = useState(null)
  const [form, setForm] = useState({ docente_uid: '', descripcion: '', fecha_compromiso: '', responsable_nombre: '' })

  useEffect(() => {
    if (!periodoActivo?.id) return
    let activo = true
    getPlanesMejora(periodoActivo.id).then(l => { if (activo) setPlanes(l) })
    return () => { activo = false }
  }, [periodoActivo?.id])

  async function handleGuardar(e) {
    e.preventDefault()
    setAlerta(null)
    try {
      const docente = (docentes ?? []).find(d => d.uid === form.docente_uid)
      if (!docente) throw new Error('Selecciona el docente del plan.')
      const plan = await crearPlanMejora({
        ...form,
        docente_nombre:          docente.nombre_completo ?? docente.nombre,
        periodo_id:              periodoActivo.id,
        porcentaje_cumplimiento: docente.cumplimiento ?? null,
        responsable_uid:         user?.uid,
        creado_por:              user?.uid,
      })
      setPlanes(prev => [plan, ...prev])
      setAbierto(false)
      setForm({ docente_uid: '', descripcion: '', fecha_compromiso: '', responsable_nombre: '' })
    } catch (err) {
      setAlerta(err.message)
    }
  }

  async function handleEstado(plan, estado) {
    await actualizarEstadoPlan(plan.id, periodoActivo.id, estado)
    setPlanes(prev => prev.map(p => p.id === plan.id ? { ...p, estado } : p))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-1.5"><IconClipboard className="h-4 w-4 text-uide-primary" /> Planes de mejora (incumplimiento)</h2>
        <button
          onClick={() => setAbierto(true)}
          className="text-xs font-medium bg-uide-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
        >
          + Registrar plan
        </button>
      </div>

      {planes.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          Sin planes de mejora registrados en este período.
        </p>
      ) : (
        <div className="space-y-2">
          {planes.map(p => (
            <div key={p.id} className="border border-gray-100 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-800 truncate">{p.docente_nombre}</p>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${ESTADO_PLAN[p.estado]}`}>{p.estado}</span>
              </div>
              <p className="text-gray-600 mt-1">{p.descripcion}</p>
              <p className="text-gray-400 mt-1">
                Compromiso: {formatearFecha(p.fecha_compromiso)} · Responsable: {p.responsable_nombre}
              </p>
              {p.estado === 'abierto' && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  <button onClick={() => handleEstado(p, 'cumplido')}   className="text-green-700 hover:underline">Marcar cumplido</button>
                  <button onClick={() => handleEstado(p, 'incumplido')} className="text-red-600 hover:underline">Incumplido</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Liquid Glass (RF-035) */}
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Registrar plan de mejoras">
        <form onSubmit={handleGuardar} className="space-y-3">
          {alerta && <AlertBanner tipo="error" mensaje={alerta} onCerrar={() => setAlerta(null)} />}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Docente *</label>
            <select
              value={form.docente_uid}
              onChange={e => setForm(f => ({ ...f, docente_uid: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
            >
              <option value="">— Seleccionar —</option>
              {(docentes ?? []).map(d => (
                <option key={d.uid} value={d.uid}>{d.nombre_completo ?? d.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan de mejoras *</label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Acciones concretas para subsanar el incumplimiento…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha compromiso *</label>
              <input
                type="date"
                value={form.fecha_compromiso}
                onChange={e => setForm(f => ({ ...f, fecha_compromiso: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Responsable seguimiento *</label>
              <input
                type="text"
                value={form.responsable_nombre}
                onChange={e => setForm(f => ({ ...f, responsable_nombre: e.target.value }))}
                placeholder="Ej: Directora de Carrera"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAbierto(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90">Registrar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
