import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import { getHorario, crearBloque, eliminarBloque } from '../../services/horarioService'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'

const DIAS = [
  { id: 'lunes',     label: 'Lunes' },
  { id: 'martes',    label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves',    label: 'Jueves' },
  { id: 'viernes',   label: 'Viernes' },
  { id: 'sabado',    label: 'Sábado' },
]

// Horas visibles: 07 a 21 (slot 21 = 21:00–22:00)
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7)

const COLORES = [
  'bg-blue-100 text-blue-900 border-blue-200',
  'bg-purple-100 text-purple-900 border-purple-200',
  'bg-green-100 text-green-900 border-green-200',
  'bg-amber-100 text-amber-900 border-amber-200',
  'bg-rose-100 text-rose-900 border-rose-200',
  'bg-cyan-100 text-cyan-900 border-cyan-200',
]

function pad(n) { return String(n).padStart(2, '0') }

export default function CalendarioDistributivo() {
  const { user } = useAuth()
  const [bloques, setBloques]             = useState([])
  const [cargando, setCargando]           = useState(true)
  const [modalAbierto, setModalAbierto]   = useState(false)
  const [slotInicial, setSlotInicial]     = useState(null)
  const [guardando, setGuardando]         = useState(false)
  const [alerta, setAlerta]               = useState('')

  useEffect(() => {
    if (!user?.uid) { setCargando(false); return }
    getHorario(user.uid)
      .then(data => setBloques(data))
      .catch(err => console.error('[CalendarioDistributivo]', err))
      .finally(() => setCargando(false))
  }, [user?.uid])

  // Pre-calcular qué slots están cubiertos por rowspan (no deben renderizar <td>)
  const cubiertos = useMemo(() => {
    const set = new Set()
    bloques.forEach(b => {
      const hI = parseInt(b.hora_inicio)
      const hF = parseInt(b.hora_fin)
      for (let h = hI + 1; h < hF; h++) {
        set.add(`${b.dia}-${h}`)
      }
    })
    return set
  }, [bloques])

  function getBloqueEnSlot(dia, hora) {
    return bloques.find(b => {
      const hI = parseInt(b.hora_inicio)
      const _hF = parseInt(b.hora_fin)
      return b.dia === dia && hI === hora
    })
  }

  function abrirModal(dia, hora) {
    setSlotInicial(dia ? { dia, hora_inicio: `${pad(hora)}:00`, hora_fin: `${pad(hora + 1)}:00` } : null)
    setModalAbierto(true)
  }

  async function handleCrear(datos) {
    // Detectar cruces horarios (RN-024)
    const hI = parseInt(datos.hora_inicio)
    const hF = parseInt(datos.hora_fin)
    const conflicto = bloques.find(b => {
      if (b.dia !== datos.dia) return false
      const bI = parseInt(b.hora_inicio)
      const bF = parseInt(b.hora_fin)
      return hI < bF && hF > bI
    })
    if (conflicto) {
      setAlerta(`Cruce horario con "${conflicto.materia}" (${conflicto.hora_inicio}–${conflicto.hora_fin}). Elige otro horario.`)
      return
    }
    if (hI < 14 && hF > 13) {
      setAlerta('El bloque se superpone con el horario de almuerzo (13:00–14:00).')
      return
    }
    setGuardando(true)
    setAlerta('')
    const nuevo = await crearBloque(user.uid, datos)
    setBloques(prev => [...prev, nuevo])
    setGuardando(false)
    setModalAbierto(false)
  }

  async function handleEliminar(id, materia) {
    if (!window.confirm(`¿Eliminar "${materia}" del horario?`)) return
    await eliminarBloque(id)
    setBloques(prev => prev.filter(b => b.id !== id))
  }

  const horasDocencia = bloques.reduce((sum, b) => {
    return sum + (parseInt(b.hora_fin) - parseInt(b.hora_inicio))
  }, 0)

  // Alerta de concentración de tutorías (requerimiento Lorena): si todas las
  // tutorías caen en un solo día y suman ≥2h, se avisa para repartirlas.
  const alertaTutorias = useMemo(() => {
    const tut = bloques.filter(b => b.tipo === 'tutoria')
    if (tut.length < 2) return null
    const dias = new Set(tut.map(b => b.dia))
    const horas = tut.reduce((s, b) => s + (parseInt(b.hora_fin) - parseInt(b.hora_inicio)), 0)
    if (dias.size === 1 && horas >= 2) {
      const dia = DIAS.find(d => d.id === [...dias][0])?.label ?? [...dias][0]
      return `Tienes ${horas}h de tutoría concentradas el ${dia}. Se recomienda repartir las tutorías en varios días.`
    }
    return null
  }, [bloques])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-800">Horario semanal</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Lunes a sábado · 07:00–22:00 · {horasDocencia}h docencia directa asignadas
          </p>
        </div>
        <button
          onClick={() => abrirModal(null, null)}
          className="flex items-center gap-2 px-4 py-2 bg-uide-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar clase
        </button>
      </div>

      {alerta && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {alerta}
          <button className="ml-3 text-red-400 hover:text-red-700" onClick={() => setAlerta('')}>×</button>
        </div>
      )}

      {alertaTutorias && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm px-4 py-3 rounded-xl">
          ⚠️ {alertaTutorias}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-14 px-2 py-2.5 text-gray-400 border-r border-gray-100 font-normal text-right">Hora</th>
                {DIAS.map(d => (
                  <th key={d.id} className="py-2.5 px-1 text-center font-semibold text-gray-600 text-xs">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map(hora => {
                const esAlmuerzo = hora === 13
                if (esAlmuerzo) {
                  return (
                    <tr key={hora} className="bg-amber-50 border-b border-amber-100">
                      <td className="px-2 py-2 text-amber-400 border-r border-amber-100 text-right font-mono">13:00</td>
                      <td colSpan={6} className="px-4 py-2 text-center text-xs text-amber-500 font-medium">
                        Almuerzo — 13:00 a 14:00 (bloqueado)
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={hora} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-2 py-0 text-gray-400 border-r border-gray-100 text-right font-mono h-10">
                      {pad(hora)}:00
                    </td>
                    {DIAS.map((d, di) => {
                      const slotKey = `${d.id}-${hora}`

                      // Este slot está cubierto por el rowspan de un bloque anterior
                      if (cubiertos.has(slotKey)) return null

                      const bloque = getBloqueEnSlot(d.id, hora)

                      if (bloque) {
                        const duracion = parseInt(bloque.hora_fin) - parseInt(bloque.hora_inicio)
                        const colorClass = COLORES[di % COLORES.length]
                        return (
                          <td
                            key={d.id}
                            rowSpan={duracion}
                            className="px-1 py-1 align-top"
                          >
                            <div
                              className={`rounded-lg border px-2 py-1.5 cursor-pointer hover:opacity-75 transition h-full min-h-[36px] ${colorClass}`}
                              onClick={() => handleEliminar(bloque.id, bloque.materia)}
                              title="Clic para eliminar"
                            >
                              <p className="font-semibold leading-tight truncate text-[11px]">{bloque.materia}</p>
                              {bloque.tipo === 'tutoria' && (
                                <span className="inline-block text-[9px] font-bold uppercase tracking-wide bg-white/60 rounded px-1 mt-0.5">Tutoría</span>
                              )}
                              {bloque.aula && (
                                <p className="text-[10px] opacity-70 mt-0.5 truncate">Aula {bloque.aula}</p>
                              )}
                              <p className="text-[10px] opacity-60">{bloque.hora_inicio}–{bloque.hora_fin}</p>
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td
                          key={d.id}
                          className="px-1 py-1 cursor-pointer hover:bg-uide-light/60 transition border-l border-gray-50"
                          onClick={() => abrirModal(d.id, hora)}
                        />
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">Clic en una clase para eliminarla · Clic en celda vacía para agregar</p>

      <Modal
        abierto={modalAbierto}
        onCerrar={() => { setModalAbierto(false); setAlerta('') }}
        titulo="Agregar clase al horario"
      >
        <BloqueForm
          inicial={slotInicial}
          onGuardar={handleCrear}
          onCancelar={() => { setModalAbierto(false); setAlerta('') }}
          cargando={guardando}
          error={alerta}
          onClearError={() => setAlerta('')}
        />
      </Modal>
    </div>
  )
}

function BloqueForm({ inicial, onGuardar, onCancelar, cargando, error, onClearError }) {
  const [form, setForm] = useState({
    dia:         inicial?.dia         ?? 'lunes',
    hora_inicio: inicial?.hora_inicio ?? '07:00',
    hora_fin:    inicial?.hora_fin    ?? '09:00',
    materia:     '',
    aula:        '',
    tipo:        'clase',
  })
  const [err, setErr] = useState('')

  const HORAS_OPTS = Array.from({ length: 15 }, (_, i) => `${pad(i + 7)}:00`)
  const HORAS_FIN  = ['08:00','09:00','10:00','11:00','12:00','13:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']
    .filter(h => h > form.hora_inicio)

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setErr('')
    onClearError?.()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.materia.trim()) { setErr('El nombre de la materia es obligatorio.'); return }
    if (form.hora_fin <= form.hora_inicio) { setErr('La hora de fin debe ser posterior a la de inicio.'); return }
    onGuardar({ ...form, materia: form.materia.trim() })
  }

  const errVisible = err || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de bloque</label>
        <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary">
          <option value="clase">Clase</option>
          <option value="tutoria">Tutoría</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Día</label>
          <select value={form.dia} onChange={e => set('dia', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary">
            {[['lunes','Lunes'],['martes','Martes'],['miercoles','Miércoles'],
              ['jueves','Jueves'],['viernes','Viernes'],['sabado','Sábado']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Materia <span className="text-red-500">*</span>
          </label>
          <input
            type="text" value={form.materia}
            onChange={e => set('materia', e.target.value)}
            placeholder="Ej: Cálculo I"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hora inicio</label>
          <select value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary">
            {HORAS_OPTS.filter(h => h !== '13:00').map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hora fin</label>
          <select value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary">
            {HORAS_FIN.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Aula (opcional)</label>
        <input type="text" value={form.aula} onChange={e => set('aula', e.target.value)}
          placeholder="Ej: B-201"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uide-primary" />
      </div>

      {errVisible && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{errVisible}</p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
          Cancelar
        </button>
        <button type="submit" disabled={cargando}
          className="px-4 py-2 text-sm font-semibold bg-uide-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition">
          {cargando ? 'Guardando…' : 'Agregar'}
        </button>
      </div>
    </form>
  )
}
