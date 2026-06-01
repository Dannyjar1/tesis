"""
Cloud Function: generación de reportes PDF/Excel en backend.
Sprint 5: para reportes pesados (muchos docentes) que no pueden generarse en el cliente.
"""
import json
import logging

logger = logging.getLogger(__name__)


def generar_reporte(request):
    """
    Genera un reporte de cumplimiento del distributivo en PDF o Excel.
    Guarda el archivo en Firebase Storage y registra en /reportes.
    """
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        }
        return ("", 204, headers)

    headers = {"Access-Control-Allow-Origin": "*"}

    # Sprint 5: implementar
    # body = request.get_json()
    # tipo = body.get("tipo", "pdf")
    # filtros = body.get("filtros", {})
    # ... generar con reportlab (PDF) o openpyxl (Excel)
    # ... subir a Firebase Storage
    # ... registrar en /reportes con codigo_verificacion

    return (
        json.dumps({"error": "Generación de reportes pendiente Sprint 5"}),
        501,
        headers,
    )
