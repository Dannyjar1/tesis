# Categorías oficiales del distributivo (Excel UIDE "2026-Distributivo-Docente-base").
# Son 4 categorías. NO existe "tutoria" ni "titulacion" como categoría: la tutoría
# es la subcategoría 1.2 dentro de DOCENCIA. El clasificador predice estas 4
# clases (mismo conjunto evaluado en Colab).

CATEGORIAS = [
    "docencia",
    "investigacion",
    "vinculacion",
    "gestion",
]

CATEGORIA_LABELS = {
    "docencia": "DOCENCIA",
    "investigacion": "INVESTIGACIÓN",
    "vinculacion": "VINCULACIÓN CON LA SOCIEDAD",
    "gestion": "GESTIÓN ACADÉMICA",
}

# Palabras clave por categoría para reglas heurísticas y fine-tuning del dataset.
# Alineadas con el clasificador mock del frontend (src/services/iaService.js)
# para que ambos motores produzcan resultados consistentes. El matching es
# insensible a acentos (ver heuristica._sin_acentos).
KEYWORDS_POR_CATEGORIA = {
    "docencia": [
        "clase", "clases", "cátedra", "laboratorio", "taller", "seminario",
        "aula", "materia", "asignatura", "enseñanza", "examen", "parcial",
        "módulo", "grupo a", "grupo b",
        # Subcategoría 1.2 Tutorías: la tutoría es parte de DOCENCIA, no categoría.
        "tutoría", "tutorias", "asesoría", "atención a estudiantes",
        "consulta", "consultas", "apoyo académico", "oficina",
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
    "gestion": [
        "reunión", "comité", "consejo", "directivo", "coordinación",
        "gestión", "administrativo", "planificación", "informe", "acreditación",
        # Subcategoría 4.9 Tutores, Lectores y Grados: la titulación (tribunal /
        # defensa de grado) es GESTIÓN ACADÉMICA, no Docencia (Excel oficial).
        "titulación", "tribunal", "defensa",
    ],
}
