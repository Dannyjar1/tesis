"""
Cloud Function: alertas automáticas de bajo cumplimiento docente.
Sprint 5: trigger en escrituras de /actividades.

Dispara cuando el % de cumplimiento semanal cae por debajo del umbral (RNF-011).
"""
import logging

logger = logging.getLogger(__name__)


def on_actividad_creada(event, context):
    """
    Firestore trigger: se ejecuta al crear/actualizar una actividad.
    Calcula el % de cumplimiento y envía alerta si cae bajo el umbral.
    """
    # Sprint 5: implementar
    # from firebase_admin import firestore
    # db = firestore.client()
    # docente_uid = event["value"]["fields"]["docente_uid"]["stringValue"]
    # periodo_id = event["value"]["fields"]["periodo_id"]["stringValue"]
    # ... calcular cumplimiento
    # ... si cumplimiento < umbral: crear notificación en /notificaciones

    logger.warning("alertas_cumplimiento: pendiente Sprint 5")
