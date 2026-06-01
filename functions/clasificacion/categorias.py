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
KEYWORDS_POR_CATEGORIA = {
    "docencia": [
        "clase", "clases", "cátedra", "laboratorio", "taller", "seminario",
        "aula", "materia", "asignatura", "estudiantes", "enseñanza",
    ],
    "investigacion": [
        "investigación", "proyecto", "artículo", "paper", "publicación",
        "laboratorio de investigación", "congreso", "ponencia", "CEDIA",
    ],
    "vinculacion": [
        "vinculación", "prácticas comunitarias", "PPP", "prácticas pre-profesionales",
        "comunidad", "empresa", "graduados", "seguimiento",
    ],
    "tutoria": [
        "tutoría", "tutorias", "asesoría", "preparación", "estudiante",
        "consulta", "apoyo académico",
    ],
    "gestion": [
        "reunión", "comité", "consejo", "directivo", "coordinación",
        "gestión", "administrativo", "planificación", "informe",
    ],
}
