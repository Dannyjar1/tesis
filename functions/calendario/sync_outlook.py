"""
Cloud Function: sincronización de eventos Outlook via Microsoft Graph API.
Sprint 2: desplegar y conectar con CalendarioPage.

Endpoint: POST /syncOutlook
Body: { "docente_uid": "...", "periodo_id": "..." }
"""
import json
import logging

logger = logging.getLogger(__name__)


def sync_outlook(request):
    """
    Sincroniza los eventos del calendario Outlook del docente con Firestore.
    Post-sincronización: activa la clasificación IA para cada evento nuevo.
    """
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        }
        return ("", 204, headers)

    headers = {"Access-Control-Allow-Origin": "*"}

    # Sprint 2: implementar
    # body = request.get_json()
    # docente_uid = body["docente_uid"]
    # periodo_id = body["periodo_id"]
    # token = token_manager.obtener_token(docente_uid)
    # eventos = await graph_client.obtener_eventos_calendario(token, ...)
    # Guardar en Firestore /eventos_calendario
    # Disparar clasificación IA para cada evento nuevo

    return (
        json.dumps({"error": "Sincronización pendiente Sprint 2"}),
        501,
        headers,
    )
