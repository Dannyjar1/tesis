import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../modules/auth/useAuth'
import { ROLES } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ModuloGuard from '../modules/auth/ModuloGuard'

// Login estático (primera pintura); el resto de páginas se cargan bajo demanda
// (code-splitting por ruta) para cumplir RNF-019: carga inicial < 2 segundos.
// pdfmake/xlsx/recharts solo se descargan al entrar a la vista que los usa.
import LoginPage from '../modules/auth/LoginPage'
const SistemaPage              = lazy(() => import('../modules/sistema/SistemaPage'))
const DashboardPage            = lazy(() => import('../modules/dashboard/DashboardPage'))
const DistributivoPage         = lazy(() => import('../modules/distributivo/DistributivoPage'))
const GestionDistributivoPage  = lazy(() => import('../modules/distributivo/GestionDistributivoPage'))
const CalendarioDistributivo   = lazy(() => import('../modules/distributivo/CalendarioDistributivo'))
const ClasificacionPage        = lazy(() => import('../modules/ia/ClasificacionPage'))
const ReportesPage             = lazy(() => import('../modules/reportes/ReportesPage'))
const NotificacionesPage       = lazy(() => import('../modules/notificaciones/NotificacionesPage'))
const AdminPage                = lazy(() => import('../modules/admin/AdminPage'))
const ActividadesDirectorPage  = lazy(() => import('../modules/actividades/ActividadesDirectorPage'))
const ActividadesDocentePage   = lazy(() => import('../modules/actividades/ActividadesDocentePage'))
const AyudaPage                = lazy(() => import('../modules/ayuda/AyudaPage'))
const PerfilPage               = lazy(() => import('../modules/perfil/PerfilPage'))
const PersonalPage             = lazy(() => import('../modules/personal/PersonalPage'))
const AdministrativoDashboard  = lazy(() => import('../modules/administrativo/AdministrativoDashboard'))

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
          <ModuloGuard modulo={['sistema-carreras', 'sistema-periodos', 'sistema-usuarios', 'sistema-roles', 'sistema-seed']}><SistemaPage /></ModuloGuard>
        } />

        {/* Dashboard — gestión */}
        <Route path="/dashboard" element={
          <ModuloGuard modulo="dashboard"><DashboardPage /></ModuloGuard>
        } />

        {/* Distributivo gestión — director y coordinador */}
        <Route path="/distributivo/gestion" element={
          <ModuloGuard modulo="distributivos"><GestionDistributivoPage /></ModuloGuard>
        } />

        {/* Vistas personales — docente y administrativo */}
        <Route path="/mi-distributivo" element={
          <ModuloGuard modulo="mi-distributivo"><DistributivoPage /></ModuloGuard>
        } />
        <Route path="/ia" element={
          <ModuloGuard modulo="ia"><ClasificacionPage /></ModuloGuard>
        } />
        <Route path="/actividades" element={
          <ModuloGuard modulo="actividades"><ActividadesDirectorPage /></ModuloGuard>
        } />
        <Route path="/mis-actividades" element={
          <ModuloGuard modulo="mis-actividades"><ActividadesDocentePage /></ModuloGuard>
        } />
        <Route path="/horario" element={
          <ModuloGuard modulo="horario">
            <CalendarioDistributivo />
          </ModuloGuard>
        } />
        <Route path="/reportes" element={
          <ModuloGuard modulo="reportes"><ReportesPage /></ModuloGuard>
        } />

        {/* Panel administrativo */}
        <Route path="/mi-panel" element={
          <ModuloGuard modulo="mi-panel">
            <AdministrativoDashboard />
          </ModuloGuard>
        } />

        {/* Personal — director (rw) y coordinador (ro) */}
        <Route path="/personal" element={
          <ModuloGuard modulo="personal">
            <PersonalPage />
          </ModuloGuard>
        } />

        {/* Todos los roles autenticados */}
        <Route path="/notificaciones" element={<NotificacionesPage />} />
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ModuloGuard modulo="admin-usuarios"><AdminPage seccion="panel" /></ModuloGuard>
        } />
        <Route path="/admin/usuarios" element={
          <ModuloGuard modulo="admin-usuarios"><AdminPage seccion="usuarios" /></ModuloGuard>
        } />
        <Route path="/admin/configuracion" element={
          <ModuloGuard modulo="configuracion"><AdminPage seccion="configuracion" /></ModuloGuard>
        } />
        <Route path="/admin/periodos" element={
          <ModuloGuard modulo="gestion-periodos"><AdminPage seccion="periodos" /></ModuloGuard>
        } />
        <Route path="/admin/auditoria" element={
          <ModuloGuard modulo="auditoria"><AdminPage seccion="auditoria" /></ModuloGuard>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
