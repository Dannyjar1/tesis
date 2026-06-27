import { useState, useEffect, useMemo } from 'react'
import Modal from '../../components/Modal'
import AlertBanner from '../../components/AlertBanner'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getActividadesDirector, estadoEfectivo } from '../../services/actividadesService'
import { generarReporteActividadesSeleccion } from '../../services/reportesService'
import { CATEGORIA_LABELS, ESTADO_ACTIVIDAD_LABELS } from '../../utils/constants'

/**
 * ReporteSemestralModal — Reporte semestral de actividades con:
 *  - Selección de actividades/docentes con checkboxes (D.1, todas por defecto).
 *  - Previa editable: encabezado, observaciones del director y notas por docente (D.2).
 * Al confirmar genera el PDF con la selección y los textos editados.
 */
export default function ReporteSemestralModal({ abierto, onCerrar, periodo, carreraId, user, onGenerado }) {
  const [cargando, setCargando]   = useState(true)
  const [actividades, setActividades] = useState([])
  const [seleccion, setSeleccion] = useState({})           // id → bool
  const [encabezado, setEncabezado] = useState('REPORTE SEMESTRAL DE CUMPLIMIENTO DE ACTIVIDADES')
  const [observaciones, setObservaciones] = useState('')
  const [notas, setNotas]         = useState({})           // docente_uid → nota
  const [generando, setGenerando] = useState(false)
  const [alerta, setAlerta]       = useState(null)

  useEffect(() => {
    if (!abierto || !periodo?.id) return
    setCargando(true)
    getActividadesDirector(periodo.id, carreraId)
      .then(lista => {
        setActividades(lista)
        setSeleccion(Object.fromEntries(lista.map(a => [a.id, true])))   // todas por defecto
      })
      .finally(() => setCargando(false))
  }, [abierto, periodo?.id, carreraId])

  // Agrupar para mostrar por docente
  const porDocente = useMemo(() => {
    const m = new Map()
    for (const a of actividades) {
      const k = a.asignada_a_uid
      if (!m.has(k)) m.set(k, { uid: k, nombre: a.asignada_a_nombre || k, items: [] })
      m.get(k).items.push(a)
    }
    return [...m.values()].sort((x, y) => x.nombre.localeCompare(y.nombre))
  }, [actividades])

  const seleccionadas = actividades.filter(a => seleccion[a.id])

  function toggle(id) { setSeleccion(s => ({ ...s, [id]: !s[id] })) }
  function toggleDocente(uid, val) {
    setSeleccion(s => {
      const next = { ...s }
      porDocente.find(d => d.uid === uid)?.items.forEach(a => { next[a.id] = val })
      return next
    })
  }

  async function handleGenerar() {
    setAlerta(null)
    setGenerando(true)
    try {
      const codigo = await generarReporteActividadesSeleccion({
        periodoId:         periodo?.id,
        periodo,
        generadoPorUid:    user?.uid,
        generadoPorNombre: user?.nombre_completo,
        actividades:       seleccionadas,
        encabezado,
        observaciones,
        notasPorDocente:   notas,
      })
      onGenerado?.(codigo)
      onCerrar()
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Reporte semestral de actividades" ancho="max-w-3xl">
      {cargando ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : actividades.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">No hay actividades registradas en este período.</p>
      ) : (
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {alerta && <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />}

          {/* Campos editables (D.2) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Encabezado institucional</label>
              <input
                value={encabezado}
                onChange={e => setEncabezado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones del director</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Observaciones generales del período…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-secondary"
              />
            </div>
          </div>

          {/* Selección de actividades por docente (D.1) + notas por docente (D.2) */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actividades a incluir ({seleccionadas.length}/{actividades.length})
            </p>
            {porDocente.map(d => {
              const todasMarcadas = d.items.every(a => seleccion[a.id])
              return (
                <div key={d.uid} className="border border-gray-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 font-medium text-sm text-gray-800 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={todasMarcadas}
                      onChange={e => toggleDocente(d.uid, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-uide-primary focus:ring-uide-secondary"
                    />
                    {d.nombre}
                  </label>
                  <div className="space-y-1 pl-6">
                    {d.items.map(a => (
                      <label key={a.id} className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!seleccion[a.id]}
                          onChange={() => toggle(a.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-uide-primary focus:ring-uide-secondary"
                        />
                        <span>
                          {a.titulo}
                          <span className="text-gray-400"> · {CATEGORIA_LABELS[a.categoria_ces] ?? a.categoria_ces} · {ESTADO_ACTIVIDAD_LABELS[estadoEfectivo(a)]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <input
                    value={notas[d.uid] ?? ''}
                    onChange={e => setNotas(n => ({ ...n, [d.uid]: e.target.value }))}
                    placeholder="Nota del director para este docente (opcional)…"
                    className="w-full mt-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-uide-secondary"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-1 sticky bottom-0 bg-white">
            <button onClick={onCerrar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button
              onClick={handleGenerar}
              disabled={generando || seleccionadas.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-uide-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {generando ? 'Generando…' : 'Generar y descargar reporte'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
