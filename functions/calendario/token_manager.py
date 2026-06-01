"""
Manejo de tokens OAuth 2.0 de Microsoft para los docentes.
Sprint 2: tokens cifrados en Firestore con TTL ≤ 1 hora (RNF-005).
"""


def obtener_token(docente_uid: str) -> str:
    """
    Recupera y descifra el token OAuth del docente desde Firestore.

    Args:
        docente_uid: UID del docente en Firebase Authentication.

    Returns:
        Access token de Microsoft Graph API.
    """
    # Sprint 2: implementar con Firebase Admin SDK
    # from firebase_admin import firestore
    # db = firestore.client()
    # ref = db.collection("usuarios").document(docente_uid)
    # doc = ref.get()
    # token_ref = doc.get("microsoft_token_ref")
    # ... descifrar y retornar token

    raise NotImplementedError("token_manager.obtener_token: pendiente Sprint 2")


def renovar_token(docente_uid: str, refresh_token: str) -> str:
    """Renueva el access token usando el refresh token de Microsoft."""
    raise NotImplementedError("token_manager.renovar_token: pendiente Sprint 2")
