import { useEffect, useState, useContext } from 'react'
import { useAuth } from '../auth/useAuth'
import { PeriodoContext } from '../../context/PeriodoContext'
import {
  getCorreosRecientes,
  etiquetarCorreo,
  importarActividadesDist,
  ETIQUETAS_DIST,
} from '../../services/outlookLabelsService'
import { crearTareasDesdeCorreos } from '../../services/iaCorreoService'
import { CATEGORIA_COLORES } from '../../utils/constants'
import { haceCuanto } from '../../utils/formatters'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertBanner from '../../components/AlertBanner'
import { IconRobot, IconBandeja, IconInfo } from '../../components/icons'

// Etiqueta DIST/* → categoría CES para colorear el badge igual que el resto del sistema.
const ETIQUETA_A_CATEGORIA = {
  'DIST/Docencia':      'docencia',
  'DIST/Investigación': 'investigacion',
  'DIST/Vinculación':   'vinculacion',
  'DIST/Gestión':       'gestion',
  'DIST/Tutoría':       'tutoria',
  'DIST/TP-Horas':      'gestion',
}

/**
 * CorreosDistPanel — Correos institucionales con etiquetas DIST/* (RF-023).
 * El docente etiqueta correos desde aquí (o desde Outlook, como prefiera) y
 * los importa como actividades del período con un clic. Funciona con mock
 * hasta tener credenciales Azure; con sesión MSAL usa Graph API real.
 */
export default function CorreosDistPanel() {
  const { user } = useAuth()
  const { periodoActivo } = useContext(PeriodoContext)

  const [correos, setCorreos]       = useState([])
  const [cargando, setCargando]     = useState(true)
  const [importando, setImportando] = useState(false)
  const [alerta, setAlerta]         = useState(null)

  // cargando arranca en true (useState), por eso no se reactiva aquí.
  useEffect(() => {
    let activo = true
    getCorreosRecientes(30)
      .then(lista => { if (activo) setCorreos(lista) })
      .catch(err => { if (activo) setAlerta({ tipo: 'error', msg: err.message }) })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [])

  async function handleEtiquetar(correoId, etiqueta) {
    setAlerta(null)
    try {
      await etiquetarCorreo(correoId, etiqueta)
      setCorreos(prev => prev.map(c =>
        c.id === correoId
          ? { ...c, categorias: etiqueta ? [etiqueta] : [], etiquetadoDist: !!etiqueta }
          : c
      ))
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    }
  }

  /** IA interpreta los correos etiquetados (texto libre → título, fecha,
   *  categoría) y crea tareas en el tablero Mis Actividades. */
  async function handleCrearTareasIA() {
    if (!user) return
    setImportando(true)
    setAlerta(null)
    try {
      const etiquetadosLista = correos.filter(c => c.etiquetadoDist)
      const { creadas } = await crearTareasDesdeCorreos(etiquetadosLista, user.uid)
      setAlerta({
        tipo: 'success',
        msg: `La IA interpretó ${etiquetadosLista.length} correo${etiquetadosLista.length !== 1 ? 's' : ''} y creó ${creadas} tarea${creadas !== 1 ? 's' : ''} en Mis Actividades.`,
      })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setImportando(false)
    }
  }

  async function handleImportar() {
    if (!user || !periodoActivo) return
    setImportando(true)
    setAlerta(null)
    try {
      const { importadas, duplicadas } = await importarActividadesDist(user.uid, periodoActivo.id)
      setAlerta({
        tipo: importadas > 0 ? 'success' : 'info',
        msg: importadas > 0
          ? `${importadas} actividad${importadas > 1 ? 'es' : ''} importada${importadas > 1 ? 's' : ''} desde correos DIST/*.${duplicadas > 0 ? ` ${duplicadas} ya existían.` : ''}`
          : duplicadas > 0
            ? `Sin novedades: las ${duplicadas} actividades etiquetadas ya estaban registradas.`
            : 'No hay correos etiquetados DIST/* para importar.',
      })
    } catch (err) {
      setAlerta({ tipo: 'error', msg: err.message })
    } finally {
      setImportando(false)
    }
  }

  const etiquetados = correos.filter(c => c.etiquetadoDist).length

  if (cargando) return (
    <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="space-y-4">
      {alerta && (
        <AlertBanner tipo={alerta.tipo} mensaje={alerta.msg} onCerrar={() => setAlerta(null)} />
      )}

      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-uide-primary">{etiquetados}</span> de{' '}
          <span className="font-semibold">{correos.length}</span> correos con etiqueta DIST/*
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleImportar}
            disabled={importando || etiquetados === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-uide-primary text-white hover:bg-uide-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {importando ? 'Importando…' : 'Importar como actividades'}
          </button>
          <button
            onClick={handleCrearTareasIA}
            disabled={importando || etiquetados === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-uide-primary text-uide-primary hover:bg-uide-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <IconRobot className="h-4 w-4" /> Crear tareas To Do con IA
          </button>
        </div>
      </div>

      {/* Lista de correos */}
      {correos.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <IconBandeja className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No hay correos recientes en el buzón.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {correos.map(correo => {
            const etiqueta = (correo.categorias ?? []).find(c => c.startsWith('DIST/')) ?? ''
            const categoria = ETIQUETA_A_CATEGORIA[etiqueta]
            return (
              <div key={correo.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{correo.asunto}</p>
                    {etiqueta && (
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORIA_COLORES[categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                        {etiqueta}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {correo.remitente} · {haceCuanto(correo.fecha)}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{correo.preview}</p>
                </div>
                <select
                  value={etiqueta}
                  onChange={e => handleEtiquetar(correo.id, e.target.value)}
                  className="flex-shrink-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-uide-secondary/40"
                  aria-label={`Etiqueta DIST para: ${correo.asunto}`}
                >
                  <option value="">Sin etiqueta</option>
                  {ETIQUETAS_DIST.map(et => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        También puedes etiquetar tus correos directamente en Outlook con las categorías
        DIST/Docencia, DIST/Investigación, DIST/Vinculación, DIST/Gestión, DIST/Tutoría o
        DIST/TP-Horas; el sistema los detecta al importar.
      </p>

      {/* Nota de integración pendiente de credenciales TI */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        <IconInfo className="h-4 w-4 inline -mt-0.5 mr-1" /><span className="font-medium">Modo demostración:</span> estos correos son datos de
        prueba. La conexión con el buzón institucional real (Microsoft Graph API) se activa
        automáticamente cuando TI entregue las credenciales del tenant Azure AD
        (<code>client_id</code> y <code>tenant_id</code>). La interpretación con IA usa el
        intérprete local hasta configurar la clave de la Claude API.
      </div>
    </div>
  )
}
