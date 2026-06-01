"""
Pipeline de preprocesamiento de texto para el modelo BETO.
Sprint 3: integrar con modelo_beto.py para clasificación de actividades.
"""
import re
import unicodedata


STOPWORDS_ES = {
    "de", "la", "el", "en", "y", "a", "los", "del", "se", "las",
    "por", "un", "con", "una", "su", "para", "es", "al", "lo", "como",
    "más", "o", "pero", "sus", "le", "ya", "fue", "que", "esto",
}


def normalizar_texto(texto: str) -> str:
    """Convierte a minúsculas y normaliza caracteres Unicode."""
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFKD", texto)
    return texto


def limpiar_texto(texto: str) -> str:
    """Elimina caracteres especiales conservando letras, números y espacios."""
    texto = re.sub(r"[^\w\sáéíóúüñ]", " ", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


def eliminar_stopwords(texto: str) -> str:
    """Elimina stopwords del español."""
    palabras = texto.split()
    return " ".join(w for w in palabras if w not in STOPWORDS_ES)


def preprocesar(texto: str, eliminar_sw: bool = False) -> str:
    """
    Pipeline completo de preprocesamiento.

    Args:
        texto: Texto crudo del evento (título + descripción).
        eliminar_sw: Si True, elimina stopwords (no recomendado para BETO).

    Returns:
        Texto normalizado listo para tokenización BETO.
    """
    texto = normalizar_texto(texto)
    texto = limpiar_texto(texto)
    if eliminar_sw:
        texto = eliminar_stopwords(texto)
    return texto
