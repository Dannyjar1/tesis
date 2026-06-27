/**
 * perfilService.js — Actualización del perfil propio del usuario.
 * RF-038: registro del número de WhatsApp para notificaciones Twilio.
 * Firestore /usuarios con fallback a la sesión local (mock).
 */
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

const SESSION_KEY = 'uide_session'

/**
 * Valida un número WhatsApp internacional: empieza con + y 10–15 dígitos.
 * @returns {string|null} mensaje de error o null si es válido
 */
export function validarTelefonoWhatsapp(telefono) {
  const limpio = (telefono ?? '').trim()
  if (limpio === '') return null // campo opcional: vacío = sin notificaciones
  if (!limpio.startsWith('+')) return 'El número debe empezar con + (ej. +593XXXXXXXXX).'
  if (!/^\+\d{10,15}$/.test(limpio)) return 'Debe tener entre 10 y 15 dígitos después del +, sin espacios ni guiones.'
  return null
}

/**
 * Guarda el número de WhatsApp del usuario en /usuarios/{uid} y actualiza
 * la sesión local para que la UI lo refleje de inmediato.
 * @param {string} uid
 * @param {string} telefono — formato +593XXXXXXXXX, o '' para eliminarlo
 */
export async function actualizarTelefonoWhatsapp(uid, telefono) {
  const error = validarTelefonoWhatsapp(telefono)
  if (error) throw new Error(error)

  const valor = (telefono ?? '').trim() || null

  if (db) {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        telefono_whatsapp: valor,
        actualizado_en:    Timestamp.now(),
      })
    } catch (err) {
      console.warn('[perfilService] Firestore error:', err.code)
    }
  }

  // Reflejar en la sesión local (mock y caché de sesión)
  const raw = localStorage.getItem(SESSION_KEY)
  if (raw) {
    const session = JSON.parse(raw)
    if (session.uid === uid) {
      session.telefono_whatsapp = valor
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  }

  return valor
}

/**
 * Guarda el título académico del usuario (ej. "Mgs.", "Ing.", "PhD.") en
 * /usuarios/{uid} y en la sesión local. Campo libre y opcional: '' lo elimina.
 * Se usa en el bloque de firmas del PDF del distributivo.
 * @param {string} uid
 * @param {string} titulo
 * @returns {Promise<string>} el título normalizado guardado
 */
export async function actualizarTituloAcademico(uid, titulo) {
  const valor = (titulo ?? '').trim()

  if (db) {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        titulo_academico: valor,
        actualizado_en:   Timestamp.now(),
      })
    } catch (err) {
      console.warn('[perfilService] Firestore error:', err.code)
    }
  }

  const raw = localStorage.getItem(SESSION_KEY)
  if (raw) {
    const session = JSON.parse(raw)
    if (session.uid === uid) {
      session.titulo_academico = valor
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  }

  // Reflejar también en el overlay compartido de usuarios (misma fuente que
  // lee getDocentes/gestión de personal), para que el título sea consistente
  // en los PDF generados por el director y en los listados (modo mock).
  try {
    const overlay = JSON.parse(localStorage.getItem('uide_sistema_usuarios')) ?? {}
    overlay[uid] = { ...(overlay[uid] ?? {}), titulo_academico: valor }
    localStorage.setItem('uide_sistema_usuarios', JSON.stringify(overlay))
  } catch { /* almacenamiento no disponible */ }

  return valor
}
