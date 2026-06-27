import { formatearHoras } from '../../utils/formatters'
import {
  DIAS_SEMANA, INVESTIGACION_SUBCATS, VINCULACION_SUBCATS, GESTION_SUBCATS,
  calcularTotales, normalizarDistributivo, asignaturasDeDia, num,
} from './modeloDistributivo'

/**
 * Desglose del distributivo según la estructura oficial de 4 bloques
 * (Docencia, Investigación, Vinculación, Gestión Académica).
 */
export default function DistributivoTable({ distributivo }) {
  if (!distributivo) return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
      <p className="text-gray-400 text-sm">No hay distributivo asignado para este período.</p>
    </div>
  )

  const dist = normalizarDistributivo(distributivo)
  const t = calcularTotales(dist)
  const asignaturas = dist.asignaturas ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
      {/* 1. DOCENCIA */}
      <BloqueHeader numero="1" titulo="Docencia" total={t.docencia} />
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">1.1 Asignatura — horario semanal ({formatearHoras(t.horasClase)})</p>
        {asignaturas.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sin bloques de horario registrados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {DIAS_SEMANA.flatMap(d =>
              asignaturasDeDia(asignaturas, d.id).map((b, i) => (
                <div key={`${d.id}-${i}`} className="flex items-center justify-between gap-2 bg-gray-50 rounded-md px-2 py-1">
                  <span className="text-xs text-gray-600 truncate">
                    <span className="font-semibold text-gray-700">{d.label}</span> · {b.materia || '—'}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{b.inicio}–{b.fin}</span>
                </div>
              )),
            )}
          </div>
        )}
      </div>
      <Fila label="1.2 Tutorías" valor={dist.horas_tutorias} />
      <Fila label="1.3 Otras actividades de docencia" valor={dist.horas_otras_docencia} />

      {/* 2. INVESTIGACIÓN */}
      <BloqueHeader numero="2" titulo="Investigación" total={t.investigacion} />
      {INVESTIGACION_SUBCATS.map(s => <Fila key={s.key} label={`${s.num} ${s.label}`} valor={dist[s.key]} />)}

      {/* 3. VINCULACIÓN */}
      <BloqueHeader numero="3" titulo="Vinculación con la Sociedad" total={t.vinculacion} />
      {VINCULACION_SUBCATS.map(s => <Fila key={s.key} label={`${s.num} ${s.label}`} valor={dist[s.key]} />)}

      {/* 4. GESTIÓN ACADÉMICA */}
      <BloqueHeader numero="4" titulo="Gestión Académica" total={t.gestion} />
      {GESTION_SUBCATS.map(s => <Fila key={s.key} label={`${s.num} ${s.label}`} valor={dist[s.key]} />)}

      {/* TOTAL */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t-2 border-gray-200">
        <span className="font-bold text-gray-800">TOTAL GENERAL</span>
        <span className="font-bold text-uide-primary">{formatearHoras(t.total)}</span>
      </div>
    </div>
  )
}

function BloqueHeader({ numero, titulo, total }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-uide-light/60 border-b border-gray-200">
      <span className="font-bold text-uide-primary text-xs uppercase tracking-wide">{numero}. {titulo}</span>
      <span className="font-bold text-uide-primary text-xs">{formatearHoras(total)}</span>
    </div>
  )
}

/** Fila de subcategoría — se oculta si no tiene horas (mantiene el desglose limpio). */
function Fila({ label, valor }) {
  if (num(valor) === 0) return null
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-gray-800">{formatearHoras(num(valor))}</span>
    </div>
  )
}
