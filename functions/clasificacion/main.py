"""
Cloud Function HTTP: clasificación de eventos con BETO.
Despliegue: firebase deploy --only functions

Endpoint: POST /clasificar
Headers:  Content-Type: application/json
          Authorization: Bearer <Firebase ID token>
Body: {
  "texto":        "título + descripción del evento",
  "evento_id":    "evt-001",
  "docente_uid":  "uid-del-docente",
  "periodo_id":   "2026-A"
}
Respuesta 200: {
  "clasificacion_id": "clas_...",
  "categoria":        "docencia",
  "confianza":        0.91,
  "probabilidades":   { "docencia": 0.91, "investigacion": 0.04, ... },
  "estado":           "provisional"
}
"""
import json
import uuid
import logging

logger = logging.getLogger(__name__)

CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age":       "3600",
}


def clasificar(request):
    """
    Firebase Cloud Function HTTP para clasificación NLP con BETO.
    Guarda el resultado en Firestore /clasificaciones_ia y actualiza
    el campo estado_clasificacion del evento en /eventos_calendario.
    """
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    headers = {"Access-Control-Allow-Origin": "*"}

    try:
        body = request.get_json(silent=True)
        if not body or "texto" not in body:
            return (json.dumps({"error": "Campo 'texto' requerido"}), 400, headers)

        texto       = body.get("texto", "").strip()
        evento_id   = body.get("evento_id", "")
        docente_uid = body.get("docente_uid", "")
        periodo_id  = body.get("periodo_id", "")

        if not texto:
            return (json.dumps({"error": "El campo 'texto' no puede estar vacío"}), 400, headers)

        # ── Pipeline de clasificación ─────────────────────────────────────────
        from .preprocesamiento import preprocesar
        from .modelo_beto import cargar_modelo, predecir_categoria

        texto_limpio = preprocesar(texto)
        tokenizer, modelo = cargar_modelo()
        resultado = predecir_categoria(texto_limpio, tokenizer, modelo)

        # ── Persistir en Firestore ────────────────────────────────────────────
        clasificacion_id = f"clas_{uuid.uuid4().hex[:12]}"

        from firebase_admin import firestore
        db = firestore.client()

        db.collection("clasificaciones_ia").document(clasificacion_id).set({
            "id":                  clasificacion_id,
            "evento_id":           evento_id,
            "docente_uid":         docente_uid,
            "periodo_id":          periodo_id,
            "texto_analizado":     texto_limpio,
            "categoria_predicha":  resultado["categoria"],
            "confianza":           resultado["confianza"],
            "probabilidades":      resultado["probabilidades"],
            "categoria_corregida": None,
            "fue_corregida":       False,
            "fecha_clasificacion": firestore.SERVER_TIMESTAMP,
            "estado":              "provisional",
        })

        # Actualiza el evento con el resultado de la clasificación
        if evento_id:
            db.collection("eventos_calendario").document(evento_id).update({
                "categoria_ia":         resultado["categoria"],
                "confianza_ia":         resultado["confianza"],
                "estado_clasificacion": "provisional",
                "clasificacion_ia_id":  clasificacion_id,
            })

        logger.info(
            "Evento %s → '%s' (confianza %.2f)",
            evento_id, resultado["categoria"], resultado["confianza"],
        )

        return (
            json.dumps({
                "clasificacion_id": clasificacion_id,
                "categoria":        resultado["categoria"],
                "confianza":        resultado["confianza"],
                "probabilidades":   resultado["probabilidades"],
                "estado":           "provisional",
            }),
            200,
            {**headers, "Content-Type": "application/json"},
        )

    except Exception as e:
        logger.exception("Error en clasificación del evento %s", body.get("evento_id", "?"))
        return (json.dumps({"error": str(e)}), 500, headers)
