import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import { ROLES } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import RoleGuard from '../modules/auth/RoleGuard'

// Login estático (primera pintura); el resto de páginas se cargan bajo demanda
// (code-splitting por ruta) para cumplir RNF-019: carga inicial < 2 segundos.
// pdfmake/xlsx/recharts solo se descargan al entrar a la vista que los usa.
import LoginPage from '../modules/auth/LoginPage'
const SistemaPage              = lazy(() => import('../modules/sistema/SistemaPage'))
const DashboardPage            = lazy(() => import('../modules/dashboard/DashboardPage'))
const DistributivoPage         = lazy(() => import('../modules/distributivo/DistributivoPage'))
const GestionDistributivoPage  = lazy(() => import('../modules/distributivo/GestionDistributivoPage'))
const CalendarioDistributivo   = lazy(() => import('../modules/distributivo/CalendarioDistributivo'))
const CalendarioPage           = lazy(() => import('../modules/calendario/CalendarioPage'))
const ClasificacionPage        = lazy(() => import('../modules/ia/ClasificacionPage'))
const ReportesPage             = lazy(() => import('../modules/reportes/ReportesPage'))
const NotificacionesPage       = lazy(() => import('../modules/notificaciones/NotificacionesPage'))
const AdminPage                = lazy(() => import('../modules/admin/AdminPage'))
const MisActividadesPage       = lazy(() => import('../modules/misactividades/MisActividadesPage'))
const AyudaPage                = lazy(() => import('../modules/ayuda/AyudaPage'))
const PerfilPage               = lazy(() => import('../modules/perfil/PerfilPage'))
const PersonalPage             = lazy(() => import('../modules/personal/PersonalPage'))
const AdministrativoDashboard  = lazy(() => import('../modules/administrativo/AdministrativoDashboard'))

const GESTION        = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.COORDINADOR]
const PERSONAL       = [ROLES.DOCENTE, ROLES.ADMINISTRATIVO]
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
          {/* Suspense: spinner mientras se descarga el chunk de la ruta (lazy) */}
          <Suspense fallback={
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

const HOME_MAP = {
  [ROLES.SUPERADMIN]:     '/sistema',
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
        {/* Superadmin — TIC */}
        <Route path="/sistema" element={
          <RoleGuard roles={[ROLES.SUPERADMIN]}><SistemaPage /></RoleGuard>
        } />

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
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />

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
