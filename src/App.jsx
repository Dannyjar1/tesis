import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PeriodoProvider } from './context/PeriodoContext'
import { NotificacionProvider } from './context/NotificacionContext'
import AppRouter from './router/AppRouter'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PeriodoProvider>
          <NotificacionProvider>
            <AppRouter />
          </NotificacionProvider>
        </PeriodoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
