/**
 * Gestión de actividades confirmadas en Firestore.
 * Sprint 1: implementar con Firebase SDK v10 modular.
 * Colección: /actividades
 */

export async function getActividades(docenteUid, periodoId) {
  throw new Error('actividadesService.getActividades: pendiente Sprint 1')
}

export async function crearActividad(actividad) {
  throw new Error('actividadesService.crearActividad: pendiente Sprint 1')
}

export async function actualizarActividad(actividadId, cambios) {
  throw new Error('actividadesService.actualizarActividad: pendiente Sprint 1')
}

export function suscribirseActividades(docenteUid, periodoId, callback) {
  // Sprint 1: usar onSnapshot
  return () => {}
}
