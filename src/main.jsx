import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initMsal } from './services/msalService'

// Procesar cuanto antes el retorno del redirect de MSAL (autorización Outlook).
// handleRedirectPromise lee el hash de la URL al cargar, antes de que el router
// navegue, para no perder el código de autorización.
initMsal()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
