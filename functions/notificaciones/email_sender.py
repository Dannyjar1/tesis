"""
Envío de correos institucionales @uide.edu.ec.
Sprint 5: usar via Firebase Extensions o Gmail API.
"""
import logging

logger = logging.getLogger(__name__)


def enviar_alerta_cumplimiento(destinatario_email: str, docente_nombre: str, porcentaje: float):
    """
    Envía un email de alerta de bajo cumplimiento al Coordinador.

    Args:
        destinatario_email: Email del coordinador/director.
        docente_nombre: Nombre completo del docente en alerta.
        porcentaje: Porcentaje de cumplimiento actual.
    """
    # Sprint 5: implementar con Firebase Extension "Trigger Email" o SendGrid
    logger.warning("email_sender: pendiente Sprint 5")
