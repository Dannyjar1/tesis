import {
  CATEGORIA_LABELS, CATEGORIA_COLORES,
  PRIORIDAD_ACTIVIDAD_LABELS, PRIORIDAD_ACTIVIDAD_COLORES,
  ESTADO_ACTIVIDAD_LABELS, ESTADO_ACTIVIDAD_COLORES, ESTADOS_ACTIVIDAD,
} from '../../utils/constants'
import { estadoEfectivo } from '../../services/actividadesService'
import { formatearFecha } from '../../utils/formatters'

// Avance permitido al docente: pendiente → en_progreso → completada.
const SIGUIENTE_ESTADO = {
  pendiente:   ESTADOS_ACTIVIDAD.EN_PROGRESO,
  en_progreso: ESTADOS_ACTIVIDAD.COMPLETADA,
}

/**
 * ActividadCard — Tarjeta de una actividad asignada (PROJECT_BRIEF §15.4).
 * @param {object} props
 * @param {object} props.actividad
 * @param {'docente'|'director'} props.modo
 * @param {(act, nuevoEstado) => void} [props.onCambiarEstado]
 * @param {(act) => void} [props.onSubirEvidencia]
 * @param {(act) => void} [props.onAmpliarPlazo]
 */
export default function ActividadCard({ actividad, modo, onCambiarEstado, onSubirEvidencia, onAmpliarPlazo }) {
  const estado = estadoEfectivo(actividad)
  const completada = estado === ESTADOS_ACTIVIDAD.COMPLETADA
  const siguiente = SIGUIENTE_ESTADO[actividad.estado]

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORIDAD_ACTIVIDAD_COLORES[actividad.prioridad]}`}>
              {PRIORIDAD_ACTIVIDAD_LABELS[actividad.prioridad] ?? actividad.prioridad}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORIA_COLORES[actividad.categoria_ces]}`}>
              {CATEGORIA_LABELS[actividad.categoria_ces] ?? actividad.categoria_ces}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ESTADO_ACTIVIDAD_COLORES[estado]}`}>
              {ESTADO_ACTIVIDAD_LABELS[estado]}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{actividad.titulo}</p>
          {actividad.descripcion && (
            <p className="text-xs text-gray-600 mt-0.5">{actividad.descripcion}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            {modo === 'director'
              ? `Asignada a: ${actividad.asignada_a_nombre || actividad.asignada_a_uid}`
              : `Asignada por: ${actividad.asignada_por_nombre || 'Dirección de Carrera'}`}
            {actividad.fecha_limite && ` · Vence: ${formatearFecha(actividad.fecha_limite)}`}
          </p>
          {actividad.observacion && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1.5">
              Observación: {actividad.observacion}
            </p>
          )}
          {actividad.evidencia_url && (
            <a
              href={actividad.evidencia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[11px] text-uide-secondary hover:underline mt-1.5 break-all"
            >
              Evidencia adjunta ✓
            </a>
          )}
        </div>
      </div>

      {/* Acciones del docente */}
      {modo === 'docente' && !completada && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
          {siguiente && (
            <button
              onClick={() => onCambiarEstado?.(actividad, siguiente)}
              className="text-uide-secondary hover:underline font-medium"
            >
              {siguiente === ESTADOS_ACTIVIDAD.EN_PROGRESO ? 'Iniciar' : 'Marcar completada'}
            </button>
          )}
          <button
            onClick={() => onSubirEvidencia?.(actividad)}
            className="text-uide-secondary hover:underline"
          >
            Subir evidencia
          </button>
        </div>
      )}

      {/* Acciones del director */}
      {modo === 'director' && !completada && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
          <button
            onClick={() => onAmpliarPlazo?.(actividad)}
            className="text-uide-secondary hover:underline"
          >
            Ampliar plazo
          </button>
        </div>
      )}
    </div>
  )
}
