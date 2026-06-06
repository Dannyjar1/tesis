/**
 * Servicio de Períodos Académicos — Firestore /periodos_academicos con fallback localStorage.
 * Estado canónico: 'activo' | 'finalizado' | 'proximo'
 */
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, Timestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const LOCAL_KEY = 'uide_periodos_v2'

const SEED_LOCAL = [
  {
    id: '2025-B',
    nombre: 'Período 2025-B',
    fecha_inicio: '2025-09-01',
    fecha_fin: '2026-02-28',
    estado: 'finalizado',
    docentes_uid: [],
  },
  {
    id: '2026-A',
    nombre: 'Período 2026-A',
    fecha_inicio: '2026-05-04',
    fecha_fin: '2026-08-21',
    estado: 'activo',
    docentes_uid: [],
  },
]

// ── Helpers localStorage ──────────────────────────────────────────────────────

function localCargar() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(SEED_LOCAL))
    return SEED_LOCAL
  } catch { return SEED_LOCAL }
}

function localGuardar(lista) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(lista))
}

function normalizarPeriodo(data, id) {
  return {
    ...data,
    id: id ?? data.id,
    fecha_inicio: data.fecha_inicio?.toDate?.()?.toISOString().split('T')[0] ?? data.fecha_inicio,
    fecha_fin:    data.fecha_fin?.toDate?.()?.toISOString().split('T')[0]    ?? data.fecha_fin,
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Devuelve todos los períodos ordenados por fecha_inicio desc. */
export async function getPeriodos() {
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, 'periodos_academicos'), orderBy('fecha_inicio', 'desc'))
      )
      return snap.docs.map(d => normalizarPeriodo(d.data(), d.id))
    } catch (err) {
      console.warn('[periodoService] Firestore no disponible, usando localStorage:', err.code)
    }
  }
  await new Promise(r => setTimeout(r, 150))
  return [...localCargar()].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))
}

/** Devuelve el período con estado 'activo', o null. */
export async function getPeriodoActivo() {
  const lista = await getPeriodos()
  return lista.find(p => p.estado === 'activo') ?? null
}

/** Crea un nuevo período. */
export async function crearPeriodo(datos) {
  const id = datos.id || `${datos.nombre.replace(/\s+/g, '-')}-${Date.now()}`

  if (db) {
    const ref = doc(db, 'periodos_academicos', id)
    const nuevo = {
      id,
      nombre:               datos.nombre,
      fecha_inicio:         Timestamp.fromDate(new Date(datos.fecha_inicio + 'T00:00:00')),
      fecha_fin:            Timestamp.fromDate(new Date(datos.fecha_fin + 'T23:59:59')),
      estado:               datos.estado ?? 'proximo',
      docentes_uid:         datos.docentes_uid ?? [],
      fecha_creacion:       Timestamp.now(),
      creado_por:           datos.creado_por ?? null,
      creado_automaticamente: datos.creado_automaticamente ?? false,
    }
    await setDoc(ref, nuevo)
    return normalizarPeriodo(nuevo, id)
  }

  await new Promise(r => setTimeout(r, 300))
  const lista = localCargar()
  const nuevo = { id, nombre: datos.nombre, fecha_inicio: datos.fecha_inicio, fecha_fin: datos.fecha_fin, estado: datos.estado ?? 'proximo', docentes_uid: [] }
  lista.push(nuevo)
  localGuardar(lista)
  return nuevo
}

/** Activa un período y pasa todos los demás 'activo' → 'finalizado'. */
export async function activarPeriodo(id) {
  if (db) {
    const batch = writeBatch(db)
    const snap = await getDocs(collection(db, 'periodos_academicos'))
    snap.docs.forEach(d => {
      if (d.id === id) {
        batch.update(d.ref, { estado: 'activo' })
      } else if (d.data().estado === 'activo') {
        batch.update(d.ref, { estado: 'finalizado' })
      }
    })
    await batch.commit()
    return
  }

  await new Promise(r => setTimeout(r, 200))
  localGuardar(localCargar().map(p => ({
    ...p,
    estado: p.id === id ? 'activo' : p.estado === 'activo' ? 'finalizado' : p.estado,
  })))
}

/**
 * Cierra el período activo y crea automáticamente el siguiente (RN-021).
 * El siguiente se crea en estado 'proximo', vacío.
 */
export async function cerrarPeriodo(id, creadoPor = null) {
  if (db) {
    const refActual = doc(db, 'periodos_academicos', id)
    const snapActual = await getDoc(refActual)
    if (!snapActual.exists()) throw new Error('Período no encontrado.')

    const actual = snapActual.data()
    const fin = actual.fecha_fin.toDate ? actual.fecha_fin.toDate() : new Date(actual.fecha_fin)

    const batch = writeBatch(db)
    batch.update(refActual, { estado: 'finalizado' })

    const inicioSig = new Date(fin)
    inicioSig.setDate(inicioSig.getDate() + 1)
    const finSig = new Date(inicioSig)
    finSig.setMonth(finSig.getMonth() + 4)
    const año = inicioSig.getFullYear()
    const sem = inicioSig.getMonth() < 6 ? 'A' : 'B'
    const idSig = `${año}-${sem}`

    const refSig = doc(db, 'periodos_academicos', idSig)
    const snapSig = await getDoc(refSig)
    if (!snapSig.exists()) {
      batch.set(refSig, {
        id: idSig,
        nombre: `Período ${año}-${sem}`,
        fecha_inicio: Timestamp.fromDate(inicioSig),
        fecha_fin:    Timestamp.fromDate(finSig),
        estado: 'proximo',
        docentes_uid: [],
        fecha_creacion: Timestamp.now(),
        creado_por: creadoPor,
        creado_automaticamente: true,
      })
    }
    await batch.commit()
    return { cerrado: id, creado: snapSig.exists() ? null : idSig }
  }

  // Fallback localStorage
  await new Promise(r => setTimeout(r, 200))
  const lista = localCargar()
  const actual = lista.find(p => p.id === id)
  if (!actual) return

  const actualizada = lista.map(p => p.id === id ? { ...p, estado: 'finalizado' } : p)
  const hayFuturo = actualizada.some(p => p.estado === 'proximo')
  if (!hayFuturo) {
    const fin = new Date(actual.fecha_fin + 'T12:00:00')
    const inicio = new Date(fin)
    inicio.setDate(inicio.getDate() + 1)
    const finSig = new Date(inicio)
    finSig.setMonth(finSig.getMonth() + 4)
    const año = inicio.getFullYear()
    const sem = inicio.getMonth() < 6 ? 'A' : 'B'
    actualizada.push({
      id: `${año}-${sem}`,
      nombre: `Período ${año}-${sem}`,
      fecha_inicio: inicio.toISOString().split('T')[0],
      fecha_fin: finSig.toISOString().split('T')[0],
      estado: 'proximo',
      docentes_uid: [],
    })
  }
  localGuardar(actualizada)
}
