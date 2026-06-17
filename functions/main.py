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
"""
from firebase_admin import initialize_app
from firebase_functions import https_fn, options

initialize_app()

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


def _normalizar(resultado):
    """Adapta el retorno estilo GCF ((body, status, headers)) a https_fn.Response."""
    if isinstance(resultado, tuple):
        body = resultado[0]
        status = resultado[1] if len(resultado) > 1 else 200
        headers = resultado[2] if len(resultado) > 2 else {}
        return body, status, headers
    return resultado, 200, {}
