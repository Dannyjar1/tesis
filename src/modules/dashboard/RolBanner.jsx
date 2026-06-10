import { Link } from 'react-router-dom'
import { CARRERA_LABELS, ROL_LABELS } from '../../utils/constants'
import { IconAcademico, IconCarpeta, IconClipboard, IconGlobo, IconHerramienta, IconLibro } from '../../components/icons'

/**
 * RolBanner — Diferenciación visual del panel por rol y área (RF-040).
 * Cada rol ve un banner con color, ícono y accesos rápidos distintos,
 * incluyendo el alcance (global o su carrera).
 */
// Fondo plano con el mismo azul institucional del menú lateral
// (bg-uide-primary, igual que Sidebar.jsx). La diferenciación por rol
// se da por el ícono, la etiqueta y los accesos rápidos de cada rol.
const ESTILOS_ROL = {
  superadmin: { icono: IconHerramienta, alcance: 'Administración técnica del sistema' },
  admin:      { icono: IconGlobo, alcance: 'Alcance global — todas las carreras' },
  director:   { icono: IconAcademico, alcance: null }, // carrera
  coordinador:{ icono: IconClipboard, alcance: null }, // carrera
  docente:    { icono: IconLibro, alcance: null },
  administrativo: { icono: IconCarpeta, alcance: 'Personal administrativo' },
}

const ACCESOS_ROL = {
  admin:       [['/reportes', 'Reportes'], ['/admin/usuarios', 'Usuarios'], ['/admin/periodos', 'Períodos']],
  director:    [['/reportes', 'Reportes'], ['/distributivo/gestion', 'Distributivos'], ['/personal', 'Mi Personal']],
  coordinador: [['/reportes', 'Reportes'], ['/distributivo/gestion', 'Distributivos']],
}

export default function RolBanner({ user }) {
  if (!user) return null
  const est = ESTILOS_ROL[user.rol] ?? ESTILOS_ROL.docente
  const accesos = ACCESOS_ROL[user.rol] ?? []
  const alcance = est.alcance
    ?? (user.carrera_id ? CARRERA_LABELS[user.carrera_id] ?? user.carrera_id : 'Sin carrera asignada')
  const rolesExtra = (user.roles ?? []).filter(r => r !== user.rol)

  return (
    <div className="rounded-xl bg-uide-primary text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3">
        <est.icono className="h-8 w-8 text-white/90" />
        <div>
          <p className="font-semibold text-sm">
            {ROL_LABELS[user.rol] ?? user.rol}
            {rolesExtra.map(r => (
              <span key={r} className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full align-middle">
                + {ROL_LABELS[r] ?? r}
              </span>
            ))}
          </p>
          <p className="text-xs text-white/80 mt-0.5">{alcance}</p>
        </div>
      </div>
      {accesos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accesos.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="text-xs font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
