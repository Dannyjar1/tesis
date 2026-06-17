import { useState } from 'react'
import Modal from '../../components/Modal'
import AlertBanner from '../../components/AlertBanner'
import { CATEGORIAS, CATEGORIA_LABELS, PRIORIDADES_ACTIVIDAD, PRIORIDAD_ACTIVIDAD_LABELS } from '../../utils/constants'
import { crearActividad, verificarCoherenciaDistributivo } from '../../services/actividadesService'

const VACIO = {
  asignada_a_uid: '', titulo: '', descripcion: '',
  categoria_ces: CATEGORIAS.DOCENCIA, prioridad: PRIORIDADES_ACTIVIDAD.NORMAL,
  fecha_inicio: '', fecha_limite: '',
}

/**
 * NuevaActividadModal — El director crea y asigna una actividad a un docente
 * (PROJECT_BRIEF §16 · RESTRUCTURE §3.1). Antes de guardar verifica la
 * coherencia con el distributivo (§3.3): si el docente no tiene horas de la
 * categoría, avisa y pide confirmación (no bloquea).
 * @param {{ docentes: object[], periodoId, asignadaPor: object, onCreada, onCerrar }} props
 */
export default function NuevaActividadModal({ docentes = [], periodoId, asignadaPor, onCreada, onCerrar }) {
  const [form, setForm]   = useState(VACIO)
  const [alerta, setAlerta] = useState(null)        // alerta de coherencia (warning)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    if (campo === 'asignada_a_uid' || campo === 'categoria_ces') setAlerta(null)
  }

  async function guardar() {
    const docente = docentes.find(d => d.uid === form.asignada_a_uid)
    setGuardando(true)
    try {
      await crearActividad({
        titulo:              form.titulo.trim(),
        descripcion:         form.descripcion.trim(),
        categoria_ces:       form.categoria_ces,
        prioridad:           form.prioridad,
        asignada_por_uid:    asignadaPor?.uid,
        asignada_por_nombre: asignadaPor?.nombre_completo ?? '',
        asignada_a_uid:      form.asignada_a_uid,
        asignada_a_nombre:   docente?.nombre_completo ?? docente?.nombre ?? '',
        carrera_id:          docente?.carrera_id ?? asignadaPor?.carrera_id ?? null,
        periodo_id:          periodoId,
        fecha_inicio:        form.fecha_inicio || new Date().toISOString(),
        fecha_limite:        form.fecha_limite || null,
      })
      onCreada?.()
      onCerrar()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.asignada_a_uid) return setError('Selecciona el docente.')
    if (!form.titulo.trim())  return setError('El título es obligatorio.')
    if (!form.fecha_limite)   return setError('Indica la fecha límite.')

    // Verificación de coherencia con el distributivo (no bloqueante).
    if (!alerta) {
      const coherencia = await verificarCoherenciaDistributivo(form.asignada_a_uid, form.categoria_ces, periodoId)
      if (coherencia.alerta) {
        setAlerta(`${coherencia.mensaje} Pulsa "Asignar de todos modos" para continuar.`)
        return
      }
    }
    await guardar()
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Nueva actividad" ancho="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error  && <AlertBanner tipo="error"   mensaje={error}  onCerrar={() => setError(null)} />}
        {alerta && <AlertBanner tipo="warning" mensaje={alerta} onCerrar={() => setAlerta(null)} />}

        <Campo label="Docente *">
          <select value={form.asignada_a_uid} onChange={e => set('asignada_a_uid', e.target.value)} className={inputCls}>
            <option value="">— Seleccionar —</option>
            {docentes.map(d => (
              <option key={d.uid} value={d.uid}>{d.nombre_completo ?? d.nombre}</option>
            ))}
          </select>
        </Campo>

        <Campo label="Título *">
          <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Elaborar informe de vinculación Q2" className={inputCls} />
        </Campo>

        <Campo label="Descripción">
          <textarea rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className={inputCls} />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Categoría CES *">
            <select value={form.categoria_ces} onChange={e => set('categoria_ces', e.target.value)} className={inputCls}>
              {Object.values(CATEGORIAS).map(c => (
                <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Prioridad *">
            <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} className={inputCls}>
              {Object.values(PRIORIDADES_ACTIVIDAD).map(p => (
                <option key={p} value={p}>{PRIORIDAD_ACTIVIDAD_LABELS[p]}</option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Fecha de inicio">
            <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Fecha límite *">
            <input type="date" value={form.fecha_limite} onChange={e => set('fecha_limite', e.target.value)} className={inputCls} />
          </Campo>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button type="submit" disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90 disabled:opacity-60">
            {guardando ? 'Asignando…' : alerta ? 'Asignar de todos modos' : 'Asignar actividad'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary'

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
