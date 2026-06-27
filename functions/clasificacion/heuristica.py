"""
Clasificador heurístico por palabras clave — fallback de BETO.

Se usa cuando:
  - CLASIFICADOR_MODO=heuristica (modo por defecto hasta subir el modelo fine-tuned), o
  - la carga/inferencia de BETO falla en runtime.

Produce el mismo contrato de respuesta que modelo_beto.predecir_categoria():
  { categoria, confianza, probabilidades, estado }
Espejo del clasificador mock del frontend (src/services/iaService.js) para que
los resultados sean consistentes entre el modo local y la Cloud Function.
"""
import logging
import unicodedata

from .categorias import CATEGORIAS, KEYWORDS_POR_CATEGORIA

logger = logging.getLogger(__name__)


def _sin_acentos(s: str) -> str:
    """Minúsculas sin marcas diacríticas ni guiones — matching insensible a
    acentos y a la limpieza de preprocesar() (NFKD descompone á → a + ◌́ y
    limpiar_texto() reemplaza guiones por espacio: pre-profesional → pre profesional)."""
    nfkd = unicodedata.normalize("NFKD", s.lower().replace("-", " "))
    return "".join(c for c in nfkd if not unicodedata.combining(c))

# Pesos por categoría: las señales muy específicas (investigación, vinculación,
# tutoría) pesan más que las genéricas (gestión) — igual que en iaService.js.
PESOS = {
    "docencia": 8,
    "investigacion": 10,
    "vinculacion": 10,
    "gestion": 5,
}

# Categoría por defecto cuando ningún keyword coincide (RN: actividades
# administrativas sin señal clara caen en gestión académica).
CATEGORIA_DEFAULT = "gestion"
CONFIANZA_MINIMA = 0.58
CONFIANZA_MAXIMA = 0.97


def clasificar_heuristica(texto: str) -> dict:
    """
    Clasifica el texto por coincidencia de palabras clave.

    Args:
        texto: Texto preprocesado (minúsculas, sin caracteres especiales).

    Returns:
        dict con: categoria, confianza, probabilidades (por categoría), estado.
    """
    t = _sin_acentos(texto)
    puntos = {}

    for categoria in CATEGORIAS:
        keywords = KEYWORDS_POR_CATEGORIA.get(categoria, [])
        matches = sum(1 for kw in keywords if _sin_acentos(kw) in t)
        if matches > 0:
            puntos[categoria] = matches * PESOS.get(categoria, 5)

    total = sum(puntos.values())

    if total == 0:
        # Sin señal: gestión con confianza baja, resto repartido uniforme.
        probabilidades = {c: 0.1 for c in CATEGORIAS}
        probabilidades[CATEGORIA_DEFAULT] = 0.6
        return {
            "categoria": CATEGORIA_DEFAULT,
            "confianza": CONFIANZA_MINIMA,
            "probabilidades": probabilidades,
            "estado": "provisional",
        }

    probabilidades = {c: round(puntos.get(c, 0) / total, 4) for c in CATEGORIAS}
    ganadora = max(puntos, key=puntos.get)
    confianza = min(CONFIANZA_MAXIMA, max(CONFIANZA_MINIMA, probabilidades[ganadora]))

    logger.debug("Heurística: '%s…' → %s (%.2f)", texto[:40], ganadora, confianza)

    return {
        "categoria": ganadora,
        "confianza": round(confianza, 4),
        "probabilidades": probabilidades,
        "estado": "provisional",
    }
