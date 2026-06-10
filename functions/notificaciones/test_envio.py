"""
test_envio.py — Prueba LOCAL del envío WhatsApp vía Twilio (RF-038).
Permite verificar el envío real desde tu PC sin desplegar las Cloud Functions.

Pasos previos (una sola vez):
  1. Crear cuenta gratis en twilio.com
  2. Messaging > Try it out > Send a WhatsApp message
  3. Desde tu celular enviar "join <codigo-del-sandbox>" al +1 415 523 8886
  4. Copiar Account SID y Auth Token a functions/.env

Uso (desde la carpeta functions/):
  python notificaciones/test_envio.py +593XXXXXXXXX            # envia semanal de ejemplo
  python notificaciones/test_envio.py +593XXXXXXXXX --diaria   # envia recordatorio diario
  python notificaciones/test_envio.py +593XXXXXXXXX --dry-run  # solo imprime, no envia
"""
import os
import sys
import io
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from notificaciones.whatsapp import (  # noqa: E402
    construir_resumen_semanal, construir_recordatorio_diario, enviar_whatsapp,
)


def cargar_env():
    """Carga functions/.env (formato KEY=VALUE) al entorno."""
    ruta = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(ruta):
        return
    for linea in io.open(ruta, encoding="utf-8"):
        linea = linea.strip()
        if linea and not linea.startswith("#") and "=" in linea:
            k, v = linea.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def tareas_ejemplo(hoy):
    return [
        {"titulo": "Preparar examen parcial Bases de Datos", "categoria": "docencia",      "fecha": hoy},
        {"titulo": "Revisar articulo para revista indexada", "categoria": "investigacion", "fecha": hoy + timedelta(days=1)},
        {"titulo": "Visita PPP empresa TechSolutions",       "categoria": "vinculacion",   "fecha": hoy + timedelta(days=3)},
        {"titulo": "Informe mensual de coordinacion",        "categoria": "gestion",       "fecha": hoy + timedelta(days=5)},
    ]


def main():
    args = sys.argv[1:]
    if not args or not args[0].startswith("+"):
        print(__doc__)
        sys.exit(1)

    telefono = args[0]
    modo = "diaria" if "--diaria" in args else "semanal"
    dry = "--dry-run" in args

    cargar_env()
    sid   = os.environ.get("TWILIO_ACCOUNT_SID", "")
    token = os.environ.get("TWILIO_AUTH_TOKEN", "")

    hoy = date.today()
    tareas = tareas_ejemplo(hoy)
    mensaje = (construir_resumen_semanal("Danny", tareas, hoy) if modo == "semanal"
               else construir_recordatorio_diario("Danny", tareas, hoy))

    print(f"── Mensaje {modo} ──\n{mensaje}\n──────────────────")

    if dry:
        print("(dry-run: no se envió)")
        return
    if not sid or sid == "placeholder":
        print("ERROR: completa TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en functions/.env")
        sys.exit(1)

    sid_msg = enviar_whatsapp(telefono, mensaje, sid, token)
    print(f"Enviado correctamente. Twilio SID: {sid_msg}")
    print("Revisa tu WhatsApp (recuerda haber hecho el 'join' del sandbox).")


if __name__ == "__main__":
    main()
