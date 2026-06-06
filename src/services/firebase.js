/**
 * firebase.js — Inicialización Firebase SDK v10 (modular).
 * Si las variables de entorno no están configuradas, exporta null
 * para que el resto de la app no explote en desarrollo.
 * Completar .env.local con los valores del Firebase Console antes de producción.
 */
import { initializeApp } from 'firebase/app'
import { getAuth }       from 'firebase/auth'
import { getFirestore }  from 'firebase/firestore'
import { getStorage }    from 'firebase/storage'

const {
  VITE_FIREBASE_API_KEY:              apiKey,
  VITE_FIREBASE_AUTH_DOMAIN:          authDomain,
  VITE_FIREBASE_PROJECT_ID:           projectId,
  VITE_FIREBASE_STORAGE_BUCKET:       storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID:  messagingSenderId,
  VITE_FIREBASE_APP_ID:               appId,
} = import.meta.env

const FIREBASE_CONFIGURADO = !!(apiKey && projectId)

if (!FIREBASE_CONFIGURADO) {
  console.warn(
    '[Firebase] Variables de entorno no configuradas. ' +
    'Completa VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID en .env.local. ' +
    'La app funciona en modo mock hasta que se conecte Firebase real.'
  )
}

const app     = FIREBASE_CONFIGURADO ? initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }) : null
const auth    = FIREBASE_CONFIGURADO ? getAuth(app)      : null
const db      = FIREBASE_CONFIGURADO ? getFirestore(app) : null
const storage = FIREBASE_CONFIGURADO ? getStorage(app)   : null

export { auth, db, storage }
export default app
