# Definición de categorías del distributivo académico reconocidas por el CES.
# Referencia: Reglamento CES 2021, Arts. 6, 7 y 8.

CATEGORIAS = [
    "docencia",
    "investigacion",
    "vinculacion",
    "tutoria",
    "gestion",
]

CATEGORIA_LABELS = {
    "docencia": "Docencia directa",
    "investigacion": "Investigación",
    "vinculacion": "Vinculación con la Sociedad",
    "tutoria": "Tutoría y preparación",
    "gestion": "Gestión institucional",
}

# Palabras clave por categoría para reglas heurísticas y fine-tuning del dataset.
# Alineadas con el clasificador mock del frontend (src/services/iaService.js)
# para que ambos motores produzcan resultados consistentes. El matching es
# insensible a acentos (ver heuristica._sin_acentos).
KEYWORDS_POR_CATEGORIA = {
    "docencia": [
        "clase", "clases", "cátedra", "laboratorio", "taller", "seminario",
        "aula", "materia", "asignatura", "enseñanza", "examen", "parcial",
        "módulo", "titulación", "tribunal", "defensa", "grupo a", "grupo b",
    ],
    "investigacion": [
        "investigación", "artículo", "paper", "publicación", "revista",
        "científico", "científica", "congreso", "ponencia", "CEDIA", "DGI",
        "indexada", "scopus",
    ],
    "vinculacion": [
        "vinculación", "comunitaria", "comunitarias", "PPP",
        "pre-profesional", "pre-profesionales", "comunidad", "barrio",
        "parroquia", "graduados", "ciudadana", "emprendedor", "adultos mayores",
    ],
    "tutoria": [
        "tutoría", "tutorias", "asesoría", "atención a estudiantes",
        "consulta", "consultas", "apoyo académico", "oficina",
    ],
    "gestion": [
        "reunión", "comité", "consejo", "directivo", "coordinación",
        "gestión", "administrativo", "planificación", "informe", "acreditación",
    ],
}
