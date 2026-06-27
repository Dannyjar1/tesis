import { useContext, useState, useEffect } from 'react'
import { PeriodoContext } from '../../context/PeriodoContext'
import { useAuth } from '../auth/useAuth'
import { getDocentes } from '../../services/distributivoService'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import EstructuraPeriodo from './EstructuraPeriodo'

const ESTADO_BADGE = {
  planificacion: 'bg-gray-100 text-gray-700',
  proximo:       'bg-blue-100 text-blue-700',
  activo:        'bg-green-100 text-green-800',
  cerrado:       'bg-amber-100 text-amber-800',
  archivado:     'bg-slate-100 text-slate-500',
}

const ESTADO_NOMBRE = {
  planificacion: 'Planificación',
  proximo:       'Próximo',
  activo:        'Activo',
  cerrado:       'Cerrado',
  archivado:     'Archivado',
}

export default function PeriodosAdmin() {
  const {
    periodos,
    historial,
    cargandoPeriodos,
    crearPeriodo,
    activarPeriodo,
    cerrarPeriodo,
  } = useContext(PeriodoContext)

  const [modalCrear, setModalCrear] = useState(false)
  const [modalEstructura, setModalEstructura] = useState(null) // período seleccionado
  const [guardando, setGuardando]   = useState(false)
  const [procesando, setProcesando] = useState(null)

  const ordenados = [...periodos].sort((a, b) =>
    b.fecha_inicio.localeCompare(a.fecha_inicio)
  )

  async function handleCrear(datos) {
    setGuardando(true)
    await crearPeriodo(datos)
    setGuardando(false)
    setModalCrear(false)
  }

  async function handleActivar(p) {
    if (!window.confirm(`¿Activar "${p.nombre}"?\nEl período activo actual pasará a estado Cerrado.`)) return
    setProcesando(p.id)
    await activarPeriodo(p)
    setProcesando(null)
  }

  async function handleCerrar(p) {
    if (!window.confirm(`¿Cerrar "${p.nombre}"?\nSe creará automáticamente el período siguiente.`)) return
    setProcesando(p.id)
    await cerrarPeriodo(p)
    setProcesando(null)
  }

  if (cargandoPeriodos) {
    return <div className="flex justify-center py-10"><LoadingSpinner /></div>
  }

  return (
    <div className="space-y-5">
      {/* Lista de períodos */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">{periodos.length} período{periodos.length !== 1 ? 's' : ''} registrados</p>
          <button
            onClick={() => setModalCrear(true)}
            className="text-xs bg-uide-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          >
            + Nuevo período
          </button>
        </div>

        {ordenados.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-sm text-gray-400">No hay períodos registrados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ordenados.map(p => (
              <div
                key={p.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 ${
                  p.estado === 'activo' ? 'border-uide-primary/40 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-800 flex items-center gap-2 flex-wrap">
                    {p.nombre}
                    {p.estado === 'activo' && (
                      <span className="text-[10px] bg-uide-primary text-white px-1.5 py-0.5 rounded-full">ACTIVO</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.fecha_inicio} — {p.fecha_fin}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[p.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ESTADO_NOMBRE[p.estado] ?? p.estado}
                  </span>
                  {/* Estructura jerárquica: Período → Carreras → Usuarios.
                      Editable en activo/próximo; consulta en finalizados. */}
                  <button
                    onClick={() => setModalEstructura(p)}
                    className="text-xs text-uide-primary border border-uide-primary/30 hover:bg-uide-primary/5 px-2.5 py-1 rounded-lg transition"
                  >
                    {p.estado === 'finalizado' ? 'Consultar' : 'Estructura'}
                  </button>
                  {(p.estado === 'planificacion' || p.estado === 'proximo') && (
                    <button
                      onClick={() => handleActivar(p)}
                      disabled={procesando === p.id}
                      className="text-xs text-white bg-uide-secondary hover:bg-uide-primary px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      {procesando === p.id ? '…' : 'Activar'}
                    </button>
                  )}
                  {p.estado === 'activo' && (
                    <button
                      onClick={() => handleCerrar(p)}
                      disabled={procesando === p.id}
                      className="text-xs text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      {procesando === p.id ? '…' : 'Cerrar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial últimos 5 períodos */}
      {historial.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial (últimos 5)</h4>
          <div className="space-y-1.5">
            {historial.map(p => (
              <div key={p.id} className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-700 font-medium">{p.nombre}</p>
                  <p className="text-xs text-gray-400">{p.fecha_inicio} — {p.fecha_fin}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalEstructura(p)}
                    className="text-xs text-uide-secondary hover:underline"
                  >
                    Consultar
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[p.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                    {ESTADO_NOMBRE[p.estado] ?? p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal crear */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => setModalCrear(false)}
        titulo="Crear período académico"
      >
        <PeriodoForm
          onGuardar={handleCrear}
          onCancelar={() => setModalCrear(false)}
          cargando={guardando}
        />
      </Modal>

      {/* Modal estructura jerárquica del período (RN: historial inmutable) */}
      <Modal
        abierto={!!modalEstructura}
        onCerrar={() => setModalEstructura(null)}
        titulo={modalEstructura?.estado === 'finalizado'
          ? `Historial — ${modalEstructura?.nombre}`
          : `Estructura del período — ${modalEstructura?.nombre}`}
        ancho="max-w-3xl"
      >
        {modalEstructura && (
          <EstructuraPeriodo periodo={modalEstructura} periodos={periodos} />
        )}
      </Modal>
    </div>
  )
}

function PeriodoForm({ onGuardar, onCancelar, cargando }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'planificacion',
  })
  const [error, setError] = useState('')

  // E.1: sugerir docentes del período anterior (de la carrera del director) para
  // importarlos al nuevo período. Por defecto todos marcados; el director decide.
  const [docentes, setDocentes] = useState([])
  const [importar, setImportar] = useState({})   // uid → bool

  useEffect(() => {
    getDocentes(user?.carrera_id ?? null).then(lista => {
      setDocentes(lista)
      setImportar(Object.fromEntries(lista.map(d => [d.uid, true])))
    })
  }, [user?.carrera_id])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.fecha_inicio)  { setError('La fecha de inicio es obligatoria.'); return }
    if (!form.fecha_fin)     { setError('La fecha de fin es obligatoria.'); return }
    if (form.fecha_fin <= form.fecha_inicio) { setError('La fecha de fin debe ser posterior al inicio.'); return }
    // E.2: solo se importan los DOCENTES seleccionados; los distributivos NO se
    // copian — el director debe crearlos nuevos en el período.
    const docentes_uid = docentes.filter(d => importar[d.uid]).map(d => d.uid)
    onGuardar({ ...form, nombre: form.nombre.trim(), docentes_uid })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          placeholder="Ej: Período 2026-B"
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={form.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={form.fecha_fin}
            onChange={e => set('fecha_fin', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Estado inicial</label>
        <select
          value={form.estado}
          onChange={e => set('estado', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
        >
          <option value="planificacion">En planificación</option>
          <option value="proximo">Próximo</option>
        </select>
      </div>

      {/* E.1: importar docentes del período anterior (NO sus distributivos) */}
      {docentes.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">¿Importar estos docentes al nuevo período?</p>
          <p className="text-[11px] text-gray-400 mb-2">
            Se copian solo los docentes; sus distributivos NO se copian (se crean nuevos).
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {docentes.map(d => (
              <label key={d.uid} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!importar[d.uid]}
                  onChange={() => setImportar(m => ({ ...m, [d.uid]: !m[d.uid] }))}
                  className="h-4 w-4 rounded border-gray-300 text-uide-primary focus:ring-uide-secondary"
                />
                {d.nombre_completo}
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {cargando ? 'Creando…' : 'Crear período'}
        </button>
      </div>
    </form>
  )
}
