import { useState } from 'react'
import { TIPOS_CONTRATO } from '../../utils/constants'
import { formatearHoras } from '../../utils/formatters'
import {
  DIAS_SEMANA,
  INVESTIGACION_SUBCATS,
  VINCULACION_SUBCATS,
  GESTION_SUBCATS,
  CAMPOS_VACIOS,
  calcularTotales,
  sugerencia20,
  duracionBloque,
  construirDistributivoDoc,
  camposDesdeDistributivo,
} from './modeloDistributivo'

// Opciones de hora 07:00–22:00 en pasos de 30 min para el editor de horario.
const HORAS_OPTS = Array.from({ length: 31 }, (_, i) => {
  const min = 7 * 60 + i * 30
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
})

/**
 * Formulario de ingreso del distributivo según la plantilla oficial UIDE
 * (estructura de 4 bloques). Solo el director/coordinador lo edita.
 * La validación de 40h es informativa: NUNCA bloquea el guardado.
 */
export default function DistributivoForm({ docente, periodoId, distributivoExistente, onGuardar, onCancelar }) {
  const horasRequeridas = TIPOS_CONTRATO[docente?.tipo_contrato]?.horas ?? null
  const horasContrato = horasRequeridas ?? 40

  const [campos, setCampos] = useState(() =>
    distributivoExistente ? camposDesdeDistributivo(distributivoExistente) : { ...CAMPOS_VACIOS, asignaturas: [] },
  )
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const t = calcularTotales(campos)
  const sugerido = sugerencia20(t.horasClase)
  const diferencia = Math.round((horasContrato - t.total) * 100) / 100
  const porcentaje = horasContrato > 0 ? Math.min((t.total / horasContrato) * 100, 100) : 0

  function set(campo, valor) {
    setCampos(prev => ({ ...prev, [campo]: valor }))
    setErrorForm('')
  }

  // ── Edición del horario (1.1 Asignatura) ────────────────────────────────────
  function agregarBloque() {
    set('asignaturas', [...campos.asignaturas, { dia: 'lunes', materia: '', inicio: '08:00', fin: '10:00' }])
  }
  function actualizarBloque(idx, campo, valor) {
    const copia = campos.asignaturas.map((b, i) => (i === idx ? { ...b, [campo]: valor } : b))
    set('asignaturas', copia)
  }
  function eliminarBloque(idx) {
    set('asignaturas', campos.asignaturas.filter((_, i) => i !== idx))
  }

  async function handleGuardar() {
    setGuardando(true)
    setErrorForm('')
    try {
      const doc = construirDistributivoDoc(campos, {
        docente_uid: docente.uid,
        periodo_id: periodoId,
        tipo_contrato: docente.tipo_contrato,
      })
      await onGuardar(doc)
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
      {/* Info docente */}
      <div className="bg-uide-light rounded-lg px-4 py-3 text-sm">
        <p className="font-semibold text-uide-primary">{docente?.nombre_completo}</p>
        <p className="text-uide-secondary text-xs">
          {TIPOS_CONTRATO[docente?.tipo_contrato]?.nombre ?? docente?.tipo_contrato} — {horasContrato}h semanales · Período {periodoId}
        </p>
      </div>

      {/* ── 1. DOCENCIA ────────────────────────────────────────────────── */}
      <Bloque numero="1" titulo="Docencia">
        {/* 1.1 Asignatura — horario semanal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">1.1 Asignatura — horario semanal</p>
              <p className="text-xs text-gray-400">
                Total de horas de clase (presencial + en línea): <span className="font-semibold text-uide-primary">{formatearHoras(t.horasClase)}</span>
              </p>
            </div>
            <button type="button" onClick={agregarBloque}
              className="text-xs font-semibold text-uide-secondary hover:text-uide-primary border border-uide-secondary/40 rounded-lg px-2.5 py-1.5 hover:bg-uide-light transition">
              + Agregar bloque
            </button>
          </div>

          {campos.asignaturas.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2">
              Sin bloques de clase. Usa "Agregar bloque" para registrar la malla horaria.
            </p>
          ) : (
            <div className="space-y-2">
              {campos.asignaturas.map((b, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-gray-50 rounded-lg p-2">
                  <select value={b.dia} onChange={e => actualizarBloque(idx, 'dia', e.target.value)}
                    className="col-span-3 border border-gray-300 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-uide-secondary">
                    {DIAS_SEMANA.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                  <input type="text" value={b.materia} placeholder="Materia"
                    onChange={e => actualizarBloque(idx, 'materia', e.target.value)}
                    className="col-span-4 border border-gray-300 rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-uide-secondary" />
                  <select value={b.inicio} onChange={e => actualizarBloque(idx, 'inicio', e.target.value)}
                    className="col-span-2 border border-gray-300 rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-uide-secondary">
                    {HORAS_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={b.fin} onChange={e => actualizarBloque(idx, 'fin', e.target.value)}
                    className="col-span-2 border border-gray-300 rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-uide-secondary">
                    {HORAS_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <button type="button" onClick={() => eliminarBloque(idx)}
                    title="Eliminar bloque"
                    className="col-span-1 text-gray-400 hover:text-red-600 text-sm font-bold">×</button>
                  {duracionBloque(b.inicio, b.fin) <= 0 && (
                    <p className="col-span-12 text-[10px] text-red-500">La hora de fin debe ser posterior a la de inicio.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 1.2 / 1.3 con sugerencia 20% */}
        <CampoHoras label="1.2 Tutorías" campo="horas_tutorias" valor={campos.horas_tutorias} onChange={set}
          hint={`Sugerido (20%): ${sugerido}h`} />
        <CampoHoras label="1.3 Otras actividades de docencia" campo="horas_otras_docencia" valor={campos.horas_otras_docencia} onChange={set}
          hint={`Sugerido (20%): ${sugerido}h`} />
      </Bloque>

      {/* ── 2. INVESTIGACIÓN ───────────────────────────────────────────── */}
      <Bloque numero="2" titulo="Investigación">
        {INVESTIGACION_SUBCATS.map(s => (
          <CampoHoras key={s.key} label={`${s.num} ${s.label}`} campo={s.key} valor={campos[s.key]} onChange={set} />
        ))}
      </Bloque>

      {/* ── 3. VINCULACIÓN CON LA SOCIEDAD ─────────────────────────────── */}
      <Bloque numero="3" titulo="Vinculación con la Sociedad">
        {VINCULACION_SUBCATS.map(s => (
          <CampoHoras key={s.key} label={`${s.num} ${s.label}`} campo={s.key} valor={campos[s.key]} onChange={set}
            hint={`Rango habitual: ${s.min}-${s.max}h`} />
        ))}
      </Bloque>

      {/* ── 4. GESTIÓN ACADÉMICA ───────────────────────────────────────── */}
      <Bloque numero="4" titulo="Gestión Académica">
        {GESTION_SUBCATS.map(s => (
          <CampoHoras key={s.key} label={`${s.num} ${s.label}`} campo={s.key} valor={campos[s.key]} onChange={set} />
        ))}
      </Bloque>

      {/* Resumen total en vivo */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 sticky bottom-0">
        <div className="flex justify-between text-sm font-semibold">
          <span>Total general</span>
          <span className={Math.abs(diferencia) < 0.01 ? 'text-green-600' : 'text-amber-600'}>
            {formatearHoras(t.total)} / {horasContrato}h
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${Math.abs(diferencia) < 0.01 ? 'bg-green-500' : porcentaje >= 100 ? 'bg-red-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          />
        </div>
        <p className="text-xs font-medium text-gray-600">
          {Math.abs(diferencia) < 0.01
            ? `Total: ${formatearHoras(t.total)} — cuadra con el contrato`
            : diferencia > 0
              ? `Total: ${formatearHoras(t.total)} — faltan ${formatearHoras(diferencia)}`
              : `Total: ${formatearHoras(t.total)} — sobran ${formatearHoras(Math.abs(diferencia))}`}
          {' · '}<span className="text-gray-400">Informativo, no bloquea el guardado.</span>
        </p>
      </div>

      {errorForm && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {errorForm}
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancelar} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="px-4 py-2 text-sm font-semibold text-white bg-uide-primary hover:bg-uide-dark rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {guardando ? 'Guardando...' : distributivoExistente ? 'Actualizar distributivo' : 'Crear distributivo'}
        </button>
      </div>
    </div>
  )
}

function Bloque({ numero, titulo, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-bold text-uide-primary mb-3">{numero}. {titulo.toUpperCase()}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function CampoHoras({ label, campo, valor, onChange, hint }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <label className="block text-sm text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          value={valor}
          onChange={e => onChange(campo, e.target.value)}
          min={0}
          step="0.5"
          placeholder="0"
          className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-uide-secondary"
        />
        <span className="text-xs text-gray-400">h</span>
      </div>
    </div>
  )
}
