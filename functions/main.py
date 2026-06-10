"""
main.py — Punto de entrada de Firebase Cloud Functions (Python).
Firebase requiere que todas las funciones se expongan desde este archivo raíz.

Despliegue:  firebase deploy --only functions
Local:       firebase emulators:start --only functions

Funciones expuestas:
  - clasificar    POST → clasificación NLP de eventos (MOD-04, RF-015)
                  Modo por defecto: heurística por keywords (sin torch).
                  Para activar BETO: subir el modelo fine-tuned, definir
                  CLASIFICADOR_MODO=beto + RUTA_MODELO_BETO y descomentar
                  torch/transformers en requirements.txt (subir memoria a 2GiB).
  - sync_outlook  POST → sincronización Outlook (MOD-03) — pendiente de
                  credenciales Azure AD; responde 501 hasta la integración.
  - notificacion_semanal  scheduled lunes 08:00 (America/Guayaquil) →
                  resumen WhatsApp de la semana vía Twilio (RF-038)
  - notificacion_diaria   scheduled diario 10:00 → recordatorio WhatsApp de
                  tareas que vencen hoy/mañana (lunes no dispara)

Secrets requeridos (firebase functions:secrets:set):
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
Variable opcional (functions/.env):
  TWILIO_WHATSAPP_FROM  (default: sandbox whatsapp:+14155238886)
"""
from firebase_admin import initialize_app
from firebase_functions import https_fn, options, scheduler_fn
from firebase_functions.params import SecretParam

initialize_app()

TWILIO_ACCOUNT_SID = SecretParam("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = SecretParam("TWILIO_AUTH_TOKEN")

# Región us-central1: la misma del proyecto Firestore (uide-distributivo-loja).
_REGION = "us-central1"

_CORS = options.CorsOptions(
    cors_origins=[
        "http://localhost:5173",
        "https://uide-distributivo-loja.web.app",
        "https://uide-distributivo-loja.firebaseapp.com",
    ],
    cors_methods=["POST", "OPTIONS"],
)


@https_fn.on_request(region=_REGION, cors=_CORS, memory=options.MemoryOption.MB_512)
def clasificar(req: https_fn.Request) -> https_fn.Response:
    """Clasifica el texto de un evento en una categoría CES (MOD-04)."""
    from clasificacion.main import clasificar as handler
    body, status, headers = _normalizar(handler(req))
    return https_fn.Response(body, status=status, headers=headers)


@https_fn.on_request(region=_REGION, cors=_CORS, memory=options.MemoryOption.MB_256)
def sync_outlook(req: https_fn.Request) -> https_fn.Response:
    """Sincroniza eventos Outlook del docente (MOD-03).

    Bloqueada hasta recibir las credenciales del tenant Azure AD de la UIDE
    (client_id + tenant_id). El frontend ya sincroniza directamente vía MSAL;
    esta función cubrirá la sincronización programada cada 24h (HU-10).
    """
    import json
    return https_fn.Response(
        json.dumps({
            "error": "No implementado: pendiente de credenciales Azure AD (tenant UIDE).",
            "detalle": "La sincronización interactiva ya opera desde el frontend vía MSAL.",
        }),
        status=501,
        headers={"Content-Type": "application/json"},
    )


@scheduler_fn.on_schedule(
    schedule="0 8 * * 1",                 # lunes 08:00
    timezone=scheduler_fn.Timezone("America/Guayaquil"),
    region=_REGION,
    secrets=[TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN],
)
def notificacion_semanal(event: scheduler_fn.ScheduledEvent) -> None:
    """Resumen semanal de actividades por WhatsApp (RF-038)."""
    from firebase_admin import firestore
    from notificaciones.whatsapp import ejecutar_notificacion
    ejecutar_notificacion(
        firestore.client(),
        TWILIO_ACCOUNT_SID.value,
        TWILIO_AUTH_TOKEN.value,
        modo="semanal",
    )


@scheduler_fn.on_schedule(
    schedule="0 10 * * *",                # todos los días 10:00
    timezone=scheduler_fn.Timezone("America/Guayaquil"),
    region=_REGION,
    secrets=[TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN],
)
def notificacion_diaria(event: scheduler_fn.ScheduledEvent) -> None:
    """Recordatorio diario de tareas que vencen hoy/mañana (RF-038).
    Los lunes no dispara: el resumen semanal ya salió a las 08:00."""
    from datetime import datetime
    from zoneinfo import ZoneInfo
    if datetime.now(ZoneInfo("America/Guayaquil")).weekday() == 0:  # lunes
        return
    from firebase_admin import firestore
    from notificaciones.whatsapp import ejecutar_notificacion
    ejecutar_notificacion(
        firestore.client(),
        TWILIO_ACCOUNT_SID.value,
        TWILIO_AUTH_TOKEN.value,
        modo="diaria",
    )


def _normalizar(resultado):
    """Adapta el retorno estilo GCF ((body, status, headers)) a https_fn.Response."""
    if isinstance(resultado, tuple):
        body = resultado[0]
        status = resultado[1] if len(resultado) > 1 else 200
        headers = resultado[2] if len(resultado) > 2 else {}
        return body, status, headers
    return resultado, 200, {}
