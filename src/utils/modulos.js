/**
 * modulos.js — Registro de MÓDULOS del sistema (RBAC dinámico).
 * Catálogo único de módulos visibles/asignables a roles. Las definiciones de
 * rol (rolesService) referencian estos IDs; el menú y las rutas se construyen
 * dinámicamente a partir de la suma de roles del usuario.
 *
 * Las ACCIONES declaradas por módulo son las que un rol puede recibir
 * (visualizar, crear, editar, aprobar, eliminar, exportar, administrar).
 */
import {
  IconCalendario, IconDocumento, IconGrafico, IconUsuarios, IconAjustes,
  IconClipboard, IconCampana, IconChispa, IconReloj, IconBandeja,
} from '../components/icons'

export const ACCIONES = ['visualizar', 'crear', 'editar', 'aprobar', 'eliminar', 'exportar', 'administrar']

// Orden del array = orden del menú lateral.
export const MODULOS = [
  // ── Gestión académica ──
  { id: 'dashboard',        label: 'Dashboard',        path: '/dashboard',            icon: IconGrafico,   acciones: ['visualizar'] },
  { id: 'distributivos',    label: 'Distributivos',    path: '/distributivo/gestion', icon: IconDocumento, acciones: ['visualizar', 'crear', 'editar', 'aprobar'] },
  { id: 'personal',         label: 'Mi Personal',      path: '/personal',             icon: IconUsuarios,  acciones: ['visualizar', 'crear', 'editar'] },
  { id: 'reportes',         label: 'Reportes',         path: '/reportes',             icon: IconGrafico,   acciones: ['visualizar', 'exportar'] },
  { id: 'gestion-periodos', label: 'Períodos',         path: '/admin/periodos',       icon: IconCalendario, acciones: ['visualizar', 'crear', 'editar', 'administrar'] },
  // ── Personal (docente / administrativo) ──
  { id: 'mi-panel',         label: 'Mi Panel',         path: '/mi-panel',             icon: IconGrafico,   acciones: ['visualizar'] },
  { id: 'mi-distributivo',  label: 'Mi Distributivo',  path: '/mi-distributivo',      icon: IconDocumento, acciones: ['visualizar', 'exportar'] },
  { id: 'mis-actividades',  label: 'Mis Actividades',  path: '/mis-actividades',      icon: IconClipboard, acciones: ['visualizar', 'crear', 'editar', 'eliminar'] },
  { id: 'horario',          label: 'Mi Horario',       path: '/horario',              icon: IconReloj,     acciones: ['visualizar'] },
  { id: 'calendario',       label: 'Calendario',       path: '/calendario',           icon: IconCalendario, acciones: ['visualizar', 'editar'] },
  { id: 'ia',               label: 'Clasificación IA', path: '/ia',                   icon: IconChispa,    acciones: ['visualizar', 'editar'] },
  // ── Administración (Prorrector) ──
  { id: 'admin-usuarios',   label: 'Usuarios',         path: '/admin/usuarios',       icon: IconUsuarios,  acciones: ['visualizar', 'crear', 'editar', 'administrar'] },
  { id: 'auditoria',        label: 'Auditoría',        path: '/admin/auditoria',      icon: IconClipboard, acciones: ['visualizar', 'exportar'] },
  { id: 'configuracion',    label: 'Configuración',    path: '/admin/configuracion',  icon: IconAjustes,   acciones: ['administrar'] },
  // ── Sistema (TIC) — pestañas de /sistema ──
  { id: 'sistema-carreras', label: 'Carreras',         path: '/sistema',              icon: IconBandeja,   acciones: ['visualizar', 'crear', 'editar', 'administrar'] },
  { id: 'sistema-periodos', label: 'Períodos',         path: '/sistema?tab=periodos', icon: IconCalendario, acciones: ['visualizar', 'administrar'] },
  { id: 'sistema-usuarios', label: 'Usuarios y Roles', path: '/sistema?tab=usuarios', icon: IconUsuarios,  acciones: ['administrar'] },
  { id: 'sistema-roles',    label: 'Roles y Permisos', path: '/sistema?tab=roles',    icon: IconAjustes,   acciones: ['administrar'] },
  { id: 'sistema-seed',     label: 'Inicialización',   path: '/sistema?tab=seed',     icon: IconAjustes,   acciones: ['administrar'] },
  // ── Común ──
  { id: 'notificaciones',   label: 'Notificaciones',   path: '/notificaciones',       icon: IconCampana,   acciones: ['visualizar'] },
]

export const MODULO_POR_ID = Object.fromEntries(MODULOS.map(m => [m.id, m]))

/** Módulos cuyo acceso es universal (no requieren permiso de rol). */
export const MODULOS_LIBRES = ['perfil', 'ayuda', 'notificaciones']
