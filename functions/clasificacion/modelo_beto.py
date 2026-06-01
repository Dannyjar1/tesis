"""
Carga y uso del modelo BETO fine-tuned para clasificación de actividades docentes.
Modelo base: dccuchile/bert-base-spanish-wwm-cased
Referencia: RNF-009 — F1-score ≥ 0.80 por categoría.

Instrucciones de despliegue:
  1. Subir modelo fine-tuned a Firebase Storage: gs://uide-app/modelos/beto-distributivo/
  2. La Cloud Function lo descarga al directorio /tmp/ en la primera invocación.
  3. El caché global _modelo evita recargas entre invocaciones de la misma instancia.
"""
import os
import logging

logger = logging.getLogger(__name__)

# ── Caché global — persiste entre invocaciones de la misma instancia ──────────
_tokenizer = None
_modelo    = None
_cargado   = False

# Orden de índices debe coincidir con el fine-tuning del dataset UIDE
INDICE_A_CATEGORIA = {
    0: "docencia",
    1: "investigacion",
    2: "vinculacion",
    3: "tutoria",
    4: "gestion",
}


def cargar_modelo(ruta_modelo: str = None):
    """
    Carga BETO fine-tuned desde Storage local o Hugging Face Hub.
    Usa caché global para no recargar entre invocaciones (optimización Cloud Function).

    Args:
        ruta_modelo: Ruta local al modelo. Si es None usa el modelo base sin fine-tuning.

    Returns:
        Tupla (tokenizer, modelo).
    """
    global _tokenizer, _modelo, _cargado

    if _cargado:
        return _tokenizer, _modelo

    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    nombre = ruta_modelo or os.environ.get(
        "RUTA_MODELO_BETO", "dccuchile/bert-base-spanish-wwm-cased"
    )
    logger.info("Cargando modelo BETO desde: %s", nombre)

    _tokenizer = AutoTokenizer.from_pretrained(nombre)
    _modelo = AutoModelForSequenceClassification.from_pretrained(
        nombre, num_labels=len(INDICE_A_CATEGORIA)
    )
    _modelo.eval()
    _cargado = True
    logger.info("Modelo BETO cargado correctamente.")
    return _tokenizer, _modelo


def predecir_categoria(texto: str, tokenizer, modelo) -> dict:
    """
    Inferencia con BETO para clasificar el texto de un evento docente.

    Args:
        texto: Texto preprocesado (título + descripción del evento).
        tokenizer: Tokenizador BETO cargado.
        modelo: Modelo AutoModelForSequenceClassification fine-tuned.

    Returns:
        dict con: categoria, confianza, probabilidades (por categoría), estado.
    """
    import torch
    import torch.nn.functional as F

    inputs = tokenizer(
        texto,
        return_tensors="pt",
        max_length=128,
        truncation=True,
        padding=True,
    )

    with torch.no_grad():
        logits = modelo(**inputs).logits

    probs = F.softmax(logits, dim=-1)[0]
    idx   = int(probs.argmax())

    return {
        "categoria":      INDICE_A_CATEGORIA[idx],
        "confianza":      float(probs[idx]),
        "probabilidades": {INDICE_A_CATEGORIA[i]: float(p) for i, p in enumerate(probs)},
        "estado":         "provisional",
    }
