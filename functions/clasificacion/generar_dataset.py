"""
generar_dataset.py — Plantilla CSV para el dataset de entrenamiento BETO (RNF-009).

Genera dataset_beto.csv con dos columnas (texto, categoria). Combina:
  1. Ejemplos sintéticos derivados de los keywords por categoría (arranque).
  2. Espacios en blanco para que el Coordinador académico pegue eventos REALES
     del calendario UIDE y los etiquete manualmente (requisito de la nota de
     implementación de RNF-009 en PROJECT.md §4).

Uso:
    python generar_dataset.py [salida.csv]

El CSV resultante se revisa/correge a mano y luego alimenta entrenar.py.
Meta mínima sugerida: 60 ejemplos reales por categoría (300 total).
"""
import csv
import sys
import io

from categorias import CATEGORIAS

# Ejemplos sintéticos de arranque por categoría (estilo de eventos Outlook UIDE).
# NO bastan para el fine-tuning: son semilla; el dataset real debe venir de
# eventos verdaderos etiquetados por el Coordinador.
EJEMPLOS_SEMILLA = {
    "docencia": [
        "Clase Programación Web Grupo A módulo React",
        "Examen parcial Bases de Datos segundo bimestre",
        "Defensa de trabajo de titulación tribunal",
        "Preparación de material para la asignatura de redes",
        "Taller práctico de laboratorio de software",
    ],
    "investigacion": [
        "Revisión de artículo científico para revista indexada",
        "Reunión del proyecto de investigación DGI",
        "Redacción de ponencia para congreso CEDIA",
        "Análisis de resultados del experimento NLP",
        "Envío de paper a revista Scopus",
    ],
    "vinculacion": [
        "Práctica comunitaria barrio La Tebaida capacitación digital",
        "Visita de seguimiento PPP empresa TechSolutions",
        "Jornada de vinculación con la sociedad adultos mayores",
        "Coordinación de prácticas pre-profesionales grupo 2",
        "Capacitación ciudadana en aplicaciones móviles",
    ],
    "tutoria": [
        "Tutoría académica consulta de estudiantes en oficina",
        "Atención a estudiantes previo al primer parcial",
        "Asesoría de proyecto integrador quinto ciclo",
        "Tutoría de recuperación asignatura de cálculo",
        "Consulta académica sobre el proyecto final",
    ],
    "gestion": [
        "Reunión del consejo académico de carrera",
        "Comité de planificación del período 2026-B",
        "Elaboración de informe mensual de coordinación",
        "Reunión directiva de acreditación CACES",
        "Planificación del distributivo del próximo período",
    ],
}

FILAS_VACIAS_POR_CATEGORIA = 55  # a llenar con eventos reales


def main(salida="dataset_beto.csv"):
    with io.open(salida, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["texto", "categoria"])
        for cat in CATEGORIAS:
            for texto in EJEMPLOS_SEMILLA.get(cat, []):
                w.writerow([texto, cat])
            # Filas vacías pre-etiquetadas para completar con eventos reales
            for _ in range(FILAS_VACIAS_POR_CATEGORIA):
                w.writerow(["", cat])
    total_semilla = sum(len(v) for v in EJEMPLOS_SEMILLA.values())
    print(f"Generado {salida}: {total_semilla} ejemplos semilla + "
          f"{FILAS_VACIAS_POR_CATEGORIA * len(CATEGORIAS)} filas por llenar.")
    print("Siguiente paso: completar con eventos reales y correr entrenar.py")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "dataset_beto.csv")
