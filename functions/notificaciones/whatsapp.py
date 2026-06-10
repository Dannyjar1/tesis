"""
Notificaciones WhatsApp vía Twilio (RF-038).

Dos disparadores programados (registrados en functions/main.py):
  - notificacion_semanal: lunes 08:00 (America/Guayaquil) — resumen de la semana
  - notificacion_diaria:  todos los días 10:00 — vencen hoy / mañana
    (los lunes no dispara: ya salió el resumen semanal a las 08:00)

Fuente de datos (esquema REAL de Firestore, ver misActividadesService.js):
  /usuarios     → telefono_whatsapp: string "+593XXXXXXXXX" (opcional)
  /tareas_todo  → docente_uid, titulo, categoria_ces, fecha_limite (Timestamp|null),
                  estado: "por_hacer" | "en_progreso" | "completada"

Envío: Twilio REST API directa con httpx (sin SDK — una sola llamada POST).
Sandbox de desarrollo: whatsapp:+14155238886.
"""
import os
import logging
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

import httpx

logger = logging.getLogger(__name__)

TZ_ECUADOR = ZoneInfo("America/Guayaquil")

# Etiquetas y emojis por categoría CES (mismo orden que el resto del sistema)
CATEGORIAS_ORDEN = ["docencia", "investigacion", "vinculacion", "tutoria", "gestion"]
CATEGORIA_LABEL = {
    "docencia":      "Docencia directa",
    "investigacion": "Investigación",
    "vinculacion":   "Vinculación con la Sociedad",
    "tutoria":       "Tutoría y preparación",
    "gestion":       "Gestión institucional",
}


# ── Acceso a datos ────────────────────────────────────────────────────────────

def usuarios_con_whatsapp(db):
    """Usuarios activos con número de WhatsApp registrado.
    El volumen es pequeño (un campus), así que se filtra en memoria y se
    evita exigir índices compuestos por un campo opcional."""
    usuarios = []
    for snap in db.collection("usuarios").stream():
        u = snap.to_dict() or {}
        tel = (u.get("telefono_whatsapp") or "").strip()
        if tel.startswith("+") and u.get("activo", True):
            usuarios.append({
                "uid":      u.get("uid") or snap.id,
                "nombre":   u.get("nombre") or u.get("nombre_completo") or "docente",
                "telefono": tel,
            })
    return usuarios


def tareas_pendientes(db, docente_uid):
    """Tareas no completadas del usuario, con fecha_limite normalizada a date
    (zona Ecuador). Solo consulta por docente_uid (sin índice compuesto);
    estado y rango de fechas se filtran en memoria."""
    tareas = []
    consulta = db.collection("tareas_todo").where("docente_uid", "==", docente_uid)
    for snap in consulta.stream():
        t = snap.to_dict() or {}
        if t.get("estado") == "completada":
            continue
        limite = t.get("fecha_limite")
        if limite is None:
            continue  # sin fecha límite no entra en recordatorios
        if hasattr(limite, "astimezone"):           # Firestore Timestamp/datetime
            fecha = limite.astimezone(TZ_ECUADOR).date()
        else:                                       # string ISO (datos del mock migrados)
            fecha = datetime.fromisoformat(str(limite).replace("Z", "+00:00")).astimezone(TZ_ECUADOR).date()
        tareas.append({
            "titulo":    t.get("titulo") or "(sin título)",
            "categoria": t.get("categoria_ces") or "gestion",
            "fecha":     fecha,
        })
    return tareas


# ── Construcción de mensajes ──────────────────────────────────────────────────

def _fmt_fecha(d) -> str:
    return d.strftime("%d/%m/%Y")


def construir_resumen_semanal(nombre, tareas, hoy):
    """Mensaje del lunes con las tareas de los próximos 7 días, agrupadas por
    categoría CES. Devuelve None si no hay tareas (no spam)."""
    fin = hoy + timedelta(days=7)
    semana = [t for t in tareas if hoy <= t["fecha"] <= fin]
    if not semana:
        return None

    lineas = [
        "*Resumen semanal — UIDE Distributivo*",
        f"Hola {nombre}, aquí están tus actividades para esta semana:",
        "",
    ]
    for cat in CATEGORIAS_ORDEN:
        del_grupo = [t for t in semana if t["categoria"] == cat]
        if not del_grupo:
            continue
        lineas.append(f"*{CATEGORIA_LABEL[cat]}*")
        for t in sorted(del_grupo, key=lambda x: x["fecha"]):
            lineas.append(f"- {t['titulo']} — vence {_fmt_fecha(t['fecha'])}")
        lineas.append("")

    lineas.append(f"Total: {len(semana)} actividad{'es' if len(semana) != 1 else ''} pendiente{'s' if len(semana) != 1 else ''} esta semana.")
    lineas.append("Ingresa a UIDE Distributivo App para más detalles.")
    return "\n".join(lineas)


def construir_recordatorio_diario(nombre, tareas, hoy):
    """Mensaje diario con tareas que vencen hoy y mañana.
    Devuelve None si no hay nada (no spam)."""
    manana = hoy + timedelta(days=1)
    vencen_hoy    = [t for t in tareas if t["fecha"] == hoy]
    vencen_manana = [t for t in tareas if t["fecha"] == manana]
    if not vencen_hoy and not vencen_manana:
        return None

    lineas = [
        "*Recordatorio diario — UIDE Distributivo*",
        f"Hola {nombre}, tus pendientes de hoy:",
        "",
    ]
    if vencen_hoy:
        lineas.append("*VENCEN HOY*")
        for t in vencen_hoy:
            lineas.append(f"- {t['titulo']} — {CATEGORIA_LABEL.get(t['categoria'], t['categoria'])}")
        lineas.append("")
    if vencen_manana:
        lineas.append("*Vencen MAÑANA*")
        for t in vencen_manana:
            lineas.append(f"- {t['titulo']} — {CATEGORIA_LABEL.get(t['categoria'], t['categoria'])}")
        lineas.append("")
    lineas.append("Recuerda registrar tu avance en la app.")
    return "\n".join(lineas)


# ── Envío Twilio ──────────────────────────────────────────────────────────────

def enviar_whatsapp(telefono, mensaje, account_sid, auth_token):
    """Envía un mensaje por la API REST de Twilio.
    Lanza excepción si Twilio responde error (se loguea por usuario, no aborta el lote)."""
    from_number = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    resp = httpx.post(
        url,
        auth=(account_sid, auth_token),
        data={
            "From": from_number,
            "To":   f"whatsapp:{telefono}",
            "Body": mensaje,
        },
        timeout=15,
    )
    if resp.status_code >= 300:
        raise RuntimeError(f"Twilio {resp.status_code}: {resp.text[:200]}")
    return resp.json().get("sid")


# ── Orquestadores (llamados desde functions/main.py) ─────────────────────────

def ejecutar_notificacion(db, account_sid, auth_token, modo):
    """Recorre los usuarios con WhatsApp y envía el mensaje según el modo.

    Args:
        modo: "semanal" | "diaria"
    Returns:
        dict {enviados, omitidos, errores}
    """
    hoy = datetime.now(TZ_ECUADOR).date()
    enviados = omitidos = errores = 0

    for usuario in usuarios_con_whatsapp(db):
        try:
            tareas = tareas_pendientes(db, usuario["uid"])
            if modo == "semanal":
                mensaje = construir_resumen_semanal(usuario["nombre"], tareas, hoy)
            else:
                mensaje = construir_recordatorio_diario(usuario["nombre"], tareas, hoy)

            if not mensaje:
                omitidos += 1
                continue

            sid = enviar_whatsapp(usuario["telefono"], mensaje, account_sid, auth_token)
            logger.info("WhatsApp %s enviado a %s (sid=%s)", modo, usuario["uid"], sid)
            enviados += 1
        except Exception:
            logger.exception("Error enviando WhatsApp %s a %s", modo, usuario["uid"])
            errores += 1

    resumen = {"enviados": enviados, "omitidos": omitidos, "errores": errores}
    logger.info("Notificación %s finalizada: %s", modo, resumen)
    return resumen
