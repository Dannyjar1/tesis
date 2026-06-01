import { useState, useEffect } from 'react'
import {
  calcularHorasPreparacion,
  calcularHorasTutoria,
  calcularHorasPC,
  calcularHorasPPP,
  calcularHorasTitulacion,
  validarCierreDistributivo,
} from '../../utils/calculos'
import { validarDistributivo } from '../../utils/validaciones'
import { formatearHoras } from '../../utils/formatters'
import { TIPOS_CONTRATO } from '../../utils/constants'

const CAMPO_DEFAULT = {
  horas_docencia_directa: '',
  materias_asignadas: '',
  horas_investigacion: '',
  estudiantes_pc: '',
  estudiantes_ppp: '',
  proyectos_director: '',
  proyectos_tribunal: '',
  horas_gestion: '',
  horas_reduccion_cargo: '',
}

function num(v) { return parseFloat(v) || 0 }

function calcularTodo(campos, horasContrato) {
  const docencia = num(campos.horas_docencia_directa)
  const preparacion = calcularHorasPreparacion(docencia)
  const tutoria = calcularHorasTutoria(num(campos.materias_asignadas))
  const vinculacion = calcularHorasPC(num(campos.estudiantes_pc)) + calcularHorasPPP(num(campos.estudiantes_ppp))
  const titulacion = calcularHorasTitulacion(num(campos.proyectos_director), num(campos.proyectos_tribunal))
  const investigacion = num(campos.horas_investigacion)
  const gestion = num(campos.horas_gestion)
  const reduccion = num(campos.horas_reduccion_cargo)

  const dist = {
    horas_docencia_directa: docencia,
    horas_preparacion: preparacion,
    horas_tutoria: tutoria,
    horas_vinculacion: vinculacion,
    horas_titulacion: titulacion,
    horas_investigacion: investigacion,
    horas_gestion: gestion,
    horas_reduccion_cargo: reduccion,
  }

  const validacion = validarCierreDistributivo(dist, horasContrato)
  return { ...dist, validacion }
}

export default function DistributivoForm({ docente, periodoId, distributivoExistente, onGuardar, onCancelar }) {
  const horasContrato = TIPOS_CONTRATO[docente?.tipo_contrato]?.horas ?? 40

  const [campos, setCampos] = useState(() => {
    if (distributivoExistente) {
      return {
        horas_docencia_directa: String(distributivoExistente.horas_docencia_directa ?? ''),
        materias_asignadas: String(distributivoExistente.materias_asignadas ?? ''),
        horas_investigacion: String(distributivoExistente.horas_investigacion ?? ''),
        estudiantes_pc: String(distributivoExistente.estudiantes_pc ?? ''),
        estudiantes_ppp: String(distributivoExistente.estudiantes_ppp ?? ''),
        proyectos_director: String(distributivoExistente.proyectos_director ?? ''),
        proyectos_tribunal: String(distributivoExistente.proyectos_tribunal ?? ''),
        horas_gestion: String(distributivoExistente.horas_gestion ?? ''),
        horas_reduccion_cargo: String(distributivoExistente.horas_reduccion_cargo ?? ''),
      }
    }
    return CAMPO_DEFAULT
  })

  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const calculado = calcularTodo(campos, horasContrato)
  const { validacion } = calculado
  const porcentaje = Math.min((calculado.horas_docencia_directa +
    calculado.horas_preparacion + calculado.horas_tutoria +
    calculado.horas_investigacion + calculado.horas_vinculacion +
    calculado.horas_titulacion + calculado.horas_gestion +
    calculado.horas_reduccion_cargo) / horasContrato * 100, 100)

  function set(campo, valor) {
    setCampos(prev => ({ ...prev, [campo]: valor }))
    setErrorForm('')
  }

  async function handleGuardar() {
    const erroresLogicos = validarDistributivo({
      horas_docencia_directa: num(campos.horas_docencia_directa),
      horas_investigacion: num(campos.horas_investigacion),
      horas_gestion: num(campos.horas_gestion),
    }, docente?.tipo_contrato)

    if (!erroresLogicos.valido) {
      setErrorForm(erroresLogicos.errores.join(' • '))
      return
    }

    setGuardando(true)
    setErrorForm('')
    try {
      await onGuardar({
        docente_uid: docente.uid,
        periodo_id: periodoId,
        tipo_contrato: docente.tipo_contrato,
        ...calculado,
        materias_asignadas: num(campos.materias_asignadas),
        estudiantes_pc: num(campos.estudiantes_pc),
        estudiantes_ppp: num(campos.estudiantes_ppp),
        proyectos_director: num(campos.proyectos_director),
        proyectos_tribunal: num(campos.proyectos_tribunal),
        total_horas: calculado.horas_docencia_directa + calculado.horas_preparacion +
          calculado.horas_tutoria + calculado.horas_investigacion +
          calculado.horas_vinculacion + calculado.horas_titulacion +
          calculado.horas_gestion + calculado.horas_reduccion_cargo,
      })
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Info docente */}
      <div className="bg-uide-light rounded-lg px-4 py-3 text-sm">
        <p className="font-semibold text-uide-primary">{docente?.nombre_completo}</p>
        <p className="text-uide-secondary text-xs">
          {docente?.tipo_contrato} — {horasContrato}h semanales · Período {periodoId}
        </p>
      </div>

      {/* Docencia y preparación */}
      <Seccion titulo="Docencia y preparación">
        <CampoInput label="Horas docencia directa" campo="horas_docencia_directa"
          valor={campos.horas_docencia_directa} onChange={set}
          hint={`Min 3h, máx ${docente?.tipo_contrato === 'TC' ? 22 : 10}h`} />
        <CampoInput label="Materias asignadas" campo="materias_asignadas"
          valor={campos.materias_asignadas} onChange={set} hint="Cuenta el número de asignaturas" />
        <CampoCalculado label="Preparación de clases" valor={calculado.horas_preparacion}
          formula="60% de docencia directa" />
        <CampoCalculado label="Tutoría académica" valor={calculado.horas_tutoria}
          formula={`${num(campos.materias_asignadas)} materias → ${calcularHorasTutoria(num(campos.materias_asignadas))}h`} />
      </Seccion>

      {/* Investigación */}
      <Seccion titulo="Investigación">
        <CampoInput label="Horas investigación" campo="horas_investigacion"
          valor={campos.horas_investigacion} onChange={set}
          hint={`Máx ${docente?.tipo_contrato === 'TC' ? 16 : 8}h. Requiere proyecto aprobado`} />
      </Seccion>

      {/* Vinculación */}
      <Seccion titulo="Vinculación con la Sociedad">
        <CampoInput label="Estudiantes en Prácticas Comunitarias (PC)"
          campo="estudiantes_pc" valor={campos.estudiantes_pc} onChange={set}
          hint="1h por cada 10 estudiantes" />
        <CampoInput label="Estudiantes en Prácticas Pre-Profesionales (PPP)"
          campo="estudiantes_ppp" valor={campos.estudiantes_ppp} onChange={set}
          hint="1h por cada 15 estudiantes" />
        <CampoCalculado label="Horas vinculación" valor={calculado.horas_vinculacion}
          formula={`PC: ${calcularHorasPC(num(campos.estudiantes_pc))}h + PPP: ${calcularHorasPPP(num(campos.estudiantes_ppp))}h`} />
      </Seccion>

      {/* Titulación */}
      <Seccion titulo="Dirección y tribunales de titulación">
        <CampoInput label="Proyectos como director de titulación"
          campo="proyectos_director" valor={campos.proyectos_director} onChange={set}
          hint="1h por proyecto" />
        <CampoInput label="Proyectos como tribunal de titulación"
          campo="proyectos_tribunal" valor={campos.proyectos_tribunal} onChange={set}
          hint="2h por proyecto" />
        <CampoCalculado label="Horas titulación" valor={calculado.horas_titulacion}
          formula={`Dir: ${num(campos.proyectos_director)}×1h + Trib: ${num(campos.proyectos_tribunal)}×2h`} />
      </Seccion>

      {/* Gestión */}
      <Seccion titulo="Gestión institucional">
        <CampoInput label="Horas gestión institucional" campo="horas_gestion"
          valor={campos.horas_gestion} onChange={set}
          hint={`Máx ${docente?.tipo_contrato === 'TC' ? 12 : 6}h. Comités, coordinación, dirección`} />
        <CampoInput label="Reducción por cargo directivo" campo="horas_reduccion_cargo"
          valor={campos.horas_reduccion_cargo} onChange={set}
          hint="Solo si aplica cargo directivo (Decano, Coordinador DGI, etc.)" />
      </Seccion>

      {/* Resumen total */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>Total calculado</span>
          <span className={validacion.valido ? 'text-green-600' : 'text-red-600'}>
            {formatearHoras(validacion.totalCalculado)} / {horasContrato}h
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${validacion.valido ? 'bg-green-500' : porcentaje > 100 ? 'bg-red-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          />
        </div>
        <p className={`text-xs font-medium ${validacion.valido ? 'text-green-700' : 'text-red-700'}`}>
          {validacion.valido ? '✓ Distribución válida — lista para aprobar' : validacion.mensaje}
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
          className="px-4 py-2 text-sm font-semibold text-white bg-uide-primary hover:bg-uide-dark rounded-lg transition disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : distributivoExistente ? 'Actualizar borrador' : 'Crear distributivo'}
        </button>
      </div>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{titulo}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CampoInput({ label, campo, valor, onChange, hint }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <label className="block text-sm text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <input
        type="number"
        value={valor}
        onChange={e => onChange(campo, e.target.value)}
        min={0}
        step="0.5"
        className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-uide-secondary"
      />
    </div>
  )
}

function CampoCalculado({ label, valor, formula }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-blue-50 rounded-lg px-3 py-2">
      <div>
        <p className="text-sm text-gray-700 font-medium">{label}</p>
        <p className="text-xs text-gray-400">{formula}</p>
      </div>
      <span className="text-sm font-bold text-uide-primary w-20 text-right">{formatearHoras(valor)}</span>
    </div>
  )
}
