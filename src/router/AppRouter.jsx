import { useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import { ROLES } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import RoleGuard from '../modules/auth/RoleGuard'

import LoginPage from '../modules/auth/LoginPage'
import DashboardPage from '../modules/dashboard/DashboardPage'
import DistributivoPage from '../modules/distributivo/DistributivoPage'
import GestionDistributivoPage from '../modules/distributivo/GestionDistributivoPage'
import CalendarioDistributivo from '../modules/distributivo/CalendarioDistributivo'
import CalendarioPage from '../modules/calendario/CalendarioPage'
import ClasificacionPage from '../modules/ia/ClasificacionPage'
import ReportesPage from '../modules/reportes/ReportesPage'
import NotificacionesPage from '../modules/notificaciones/NotificacionesPage'
import AdminPage from '../modules/admin/AdminPage'
import MisActividadesPage from '../modules/misactividades/MisActividadesPage'
import PersonalPage from '../modules/personal/PersonalPage'
import AdministrativoDashboard from '../modules/administrativo/AdministrativoDashboard'

const GESTION       = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.COORDINADOR]
const PERSONAL      = [ROLES.DOCENTE, ROLES.ADMINISTRATIVO]   // vistas propias de cada usuario
const DOCENTES      = [ROLES.DOCENTE]
const ADMIN_DIRECTOR = [ROLES.ADMIN, ROLES.DIRECTOR]

function AuthLayout() {
  const { user, loading } = useAuth()
  const [sidebarCerrado, setSidebarCerrado] = useState(() => window.innerWidth < 768)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        cerrado={sidebarCerrado}
        onClose={() => setSidebarCerrado(true)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          sidebarCerrado={sidebarCerrado}
          onToggleSidebar={() => setSidebarCerrado(v => !v)}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const HOME_MAP = {
  [ROLES.ADMIN]:          '/dashboard',
  [ROLES.DIRECTOR]:       '/dashboard',
  [ROLES.COORDINADOR]:    '/dashboard',
  [ROLES.DOCENTE]:        '/mi-distributivo',
  [ROLES.ADMINISTRATIVO]: '/mi-panel',
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={HOME_MAP[user.rol] ?? '/dashboard'} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route element={<AuthLayout />}>
        {/* Dashboard — gestión */}
        <Route path="/dashboard" element={
          <RoleGuard roles={GESTION}><DashboardPage /></RoleGuard>
        } />

        {/* Distributivo gestión — director y coordinador */}
        <Route path="/distributivo/gestion" element={
          <RoleGuard roles={GESTION}><GestionDistributivoPage /></RoleGuard>
        } />

        {/* Vistas personales — docente y administrativo */}
        <Route path="/mi-distributivo" element={
          <RoleGuard roles={PERSONAL}><DistributivoPage /></RoleGuard>
        } />
        <Route path="/calendario" element={
          <RoleGuard roles={PERSONAL}><CalendarioPage /></RoleGuard>
        } />
        <Route path="/ia" element={
          <RoleGuard roles={PERSONAL}><ClasificacionPage /></RoleGuard>
        } />
        <Route path="/mis-actividades" element={
          <RoleGuard roles={[...PERSONAL, ROLES.COORDINADOR, ROLES.DIRECTOR]}>
            <MisActividadesPage />
          </RoleGuard>
        } />
        <Route path="/horario" element={
          <RoleGuard roles={PERSONAL}>
            <CalendarioDistributivo />
          </RoleGuard>
        } />
        <Route path="/reportes" element={
          <RoleGuard roles={[...GESTION, ROLES.ADMINISTRATIVO]}><ReportesPage /></RoleGuard>
        } />

        {/* Panel administrativo */}
        <Route path="/mi-panel" element={
          <RoleGuard roles={[ROLES.ADMINISTRATIVO]}>
            <AdministrativoDashboard />
          </RoleGuard>
        } />

        {/* Personal — director (rw) y coordinador (ro) */}
        <Route path="/personal" element={
          <RoleGuard roles={[ROLES.DIRECTOR, ROLES.COORDINADOR]}>
            <PersonalPage />
          </RoleGuard>
        } />

        {/* Todos los roles autenticados */}
        <Route path="/notificaciones" element={<NotificacionesPage />} />

        {/* Admin */}
        <Route path="/admin" element={
          <RoleGuard roles={[ROLES.ADMIN]}><AdminPage seccion="panel" /></RoleGuard>
        } />
        <Route path="/admin/usuarios" element={
          <RoleGuard roles={[ROLES.ADMIN]}><AdminPage seccion="usuarios" /></RoleGuard>
        } />
        <Route path="/admin/configuracion" element={
          <RoleGuard roles={[ROLES.ADMIN]}><AdminPage seccion="configuracion" /></RoleGuard>
        } />
        <Route path="/admin/periodos" element={
          <RoleGuard roles={ADMIN_DIRECTOR}><AdminPage seccion="periodos" /></RoleGuard>
        } />
        <Route path="/admin/auditoria" element={
          <RoleGuard roles={ADMIN_DIRECTOR}><AdminPage seccion="auditoria" /></RoleGuard>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
