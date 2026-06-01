"""
Cliente HTTP para Microsoft Graph API.
Sprint 2: implementar con httpx o requests.
Endpoint usado: GET /me/calendarView
"""


async def obtener_eventos_calendario(access_token: str, start_datetime: str, end_datetime: str) -> list:
    """
    Obtiene eventos del calendario Outlook del docente via Microsoft Graph API.

    Args:
        access_token: Token OAuth 2.0 del docente (de Firestore cifrado).
        start_datetime: ISO 8601 — inicio del período académico.
        end_datetime: ISO 8601 — fin del período académico.

    Returns:
        Lista de eventos del calendario.
    """
    # Sprint 2: implementar
    # import httpx
    # url = "https://graph.microsoft.com/v1.0/me/calendarView"
    # params = {
    #     "startDateTime": start_datetime,
    #     "endDateTime": end_datetime,
    #     "$select": "subject,body,start,end,location",
    # }
    # headers = {"Authorization": f"Bearer {access_token}"}
    # async with httpx.AsyncClient() as client:
    #     response = await client.get(url, params=params, headers=headers)
    #     response.raise_for_status()
    #     return response.json().get("value", [])

    raise NotImplementedError("graph_client.obtener_eventos_calendario: pendiente Sprint 2")
