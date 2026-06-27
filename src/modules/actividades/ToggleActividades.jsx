import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

/**
 * ToggleActividades — Conmutador entre la vista de gestión (director/coordinador)
 * y la vista personal del docente. Solo se muestra a usuarios que ejercen un
 * cargo Y además son docentes (ej. Lorena: directora + docente), para que puedan
 * alternar entre "lo que asignan" y "lo que les asignaron" (PROJECT_BRIEF C.1).
 */
export default function ToggleActividades() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const roles = user?.roles ?? []
  const esGestor  = roles.includes('director') || roles.includes('coordinador')
  const esDocente = roles.includes('docente')
  if (!(esGestor && esDocente)) return null

  const tabs = [
    { to: '/actividades',     label: 'Asignadas por mí' },
    { to: '/mis-actividades', label: 'Mis actividades' },
  ]
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {tabs.map(t => (
        <Link
          key={t.to}
          to={t.to}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            pathname === t.to ? 'bg-white text-uide-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
