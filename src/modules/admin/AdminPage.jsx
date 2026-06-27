import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { ROL_LABELS, ROLES, TIPO_CONTRATO_LABELS } from '../../utils/constants'
import { USUARIOS_SEED } from '../../services/seedData'
import AuditoriaLog from './AuditoriaLog'
import PeriodosAdmin from './PeriodosAdmin'
import {
  inicializarFirestore,
  inicializarPeriodoActivo,
  inicializarDistributivos,
  firestoreYaInicializado,
} from '../../services/firestoreInitService'

// Registros de auditoría mock — en Firebase vendrían de /auditoria vía onSnapshot
const AUDITORIA_MOCK = [
  {
    id: 'audit-001',
    usuario_uid: 'mock-director-001',
    usuario_nombre: 'Dr. Carlos Rodríguez Vega',
    accion: 'aprobar_distributivo',
    coleccion: 'distributivos',
    documento_id: 'mock-docente-tc-001_2026-A',
    campo_modificado: 'estado',
    valor_anterior: 'borrador',
    valor_nuevo: 'aprobado',
    timestamp: new Date(2026, 4, 18, 10, 30).toISOString(),
  },
  {
    id: 'audit-002',
    usuario_uid: 'mock-director-001',
    usuario_nombre: 'Dr. Carlos Rodríguez Vega',
    accion: 'crear_distributivo',
    coleccion: 'distributivos',
    documento_id: 'mock-docente-tc-001_2026-A',
    campo_modificado: null,
    valor_anterior: null,
    valor_nuevo: 'borrador',
    timestamp: new Date(2026, 2, 20, 9, 0).toISOString(),
  },
  {
    id: 'audit-003',
    usuario_uid: 'mock-admin-001',
    usuario_nombre: 'Administrador del Sistema',
    accion: 'crear_periodo',
    coleccion: 'periodos_academicos',
    documento_id: '2026-A',
    campo_modificado: 'estado',
    valor_anterior: null,
    valor_nuevo: 'activo',
    timestamp: new Date(2026, 2, 1, 8, 0).toISOString(),
  },
]

// La administración del sistema (auditoría/configuración) la asume el superadmin
// (TIC); los períodos los gestionan superadmin y director.
const TABS = [
  { id: 'auditoria',     label: 'Historial de auditoría',  roles: [ROLES.SUPERADMIN] },
  { id: 'periodos',      label: 'Períodos académicos',      roles: [ROLES.SUPERADMIN, ROLES.DIRECTOR] },
  { id: 'configuracion', label: 'Configuración',            roles: [ROLES.SUPERADMIN] },
]

function PanelFirebase() {
  const [estado, setEstado] = useState('idle') // idle | cargando | ok | error
  const [resultado, setResultado] = useState(null)

  async function handleInit() {
    setEstado('cargando')
    try {
      const yaInit = await firestoreYaInicializado()
      if (yaInit) {
        setResultado({ msg: 'Firestore ya tiene datos semilla. No se realizaron cambios.', tipo: 'warn' })
        setEstado('ok')
        return
      }
      const r1 = await inicializarFirestore()
      const r2 = await inicializarPeriodoActivo()
      const r3 = await inicializarDistributivos()
      setResultado({
        msg: `Cargados: ${r1.carreras} carrera(s), ${r1.usuarios} usuario(s), ${r3.distributivos} distributivo(s). Período activo: ${r2.creado ? 'creado' : 'ya existía'}.`,
        tipo: 'ok',
      })
      setEstado('ok')
    } catch (err) {
      setResultado({ msg: err.message, tipo: 'error' })
      setEstado('error')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Inicialización de Firestore</h2>
        <p className="text-xs text-gray-400 mt-1">
          Carga las carreras y usuarios semilla en Firestore. Ejecutar solo una vez al desplegar. Es idempotente.
        </p>
      </div>
      <button
        onClick={handleInit}
        disabled={estado === 'cargando'}
        className="px-4 py-2 bg-[#003087] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
      >
        {estado === 'cargando' ? 'Cargando datos...' : 'Inicializar Firestore'}
      </button>
      {resultado && (
        <div className={`text-sm rounded-lg px-4 py-3 border ${
          resultado.tipo === 'ok'   ? 'bg-green-50 border-green-200 text-green-800' :
          resultado.tipo === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                      'bg-red-50 border-red-200 text-red-700'
        }`}>
          {resultado.msg}
        </div>
      )}
    </div>
  )
}

export default function AdminPage({ seccion = 'auditoria' }) {
  const { user }    = useAuth()
  const todosUsuarios = USUARIOS_SEED

  const tabsVisibles = TABS.filter(t => t.roles.includes(user?.rol))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
        <p className="text-gray-500 text-sm mt-0.5">{ROL_LABELS[user?.rol]}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabsVisibles.map(t => (
          <a
            key={t.id}
            href={`/admin/${t.id === 'auditoria' ? 'auditoria' : t.id === 'periodos' ? 'periodos' : t.id === 'usuarios' ? 'usuarios' : 'configuracion'}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              seccion === t.id
                ? 'bg-white text-uide-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Contenido por sección */}
      {seccion === 'auditoria' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Registro inmutable de cambios al sistema (RF-021, RN-015).
            </p>
            <span className="text-xs text-gray-400">{AUDITORIA_MOCK.length} registros</span>
          </div>
          <AuditoriaLog registros={AUDITORIA_MOCK} />
        </div>
      )}

      {seccion === 'usuarios' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Usuarios del sistema</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todosUsuarios.map(d => (
                <tr key={d.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.nombre_completo}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-uide-light text-uide-primary px-2 py-0.5 rounded-full font-medium">
                      {ROL_LABELS[d.rol] ?? d.rol}
                      {d.tipo_contrato ? ` — ${TIPO_CONTRATO_LABELS[d.tipo_contrato] ?? d.tipo_contrato}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seccion === 'periodos' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Períodos académicos</h2>
          <PeriodosAdmin />
        </div>
      )}

      {seccion === 'panel' && (
        <PanelFirebase />
      )}

      {seccion === 'configuracion' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Parámetros del sistema</h2>
          <div className="space-y-3">
            {[
              { label: 'Umbral de alerta de cumplimiento', valor: '80%' },
              { label: 'Frecuencia de sincronización de calendario', valor: 'Diaria' },
              { label: 'Notificaciones automáticas', valor: 'Activas' },
              { label: 'Versión del sistema', valor: '1.0.0' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-800">{item.valor}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            La configuración editable se habilitará en el sprint de integración Firebase (colección /configuracion).
          </p>
        </div>
      )}
    </div>
  )
}
