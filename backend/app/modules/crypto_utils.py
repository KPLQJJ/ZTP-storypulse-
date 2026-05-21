from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    key = settings.api_encryption_key.encode() if isinstance(settings.api_encryption_key, str) else settings.api_encryption_key
    if len(key) != 44:
        raise RuntimeError("API_ENCRYPTION_KEY must be a 44-character base64-encoded 32-byte key")
    return Fernet(key)


def encrypt_api_key(plain: str) -> str:
    return _get_fernet().encrypt(plain.encode()).decode()


def decrypt_api_key(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()


def mask_api_key(encrypted: str) -> str:
    """Show only last 4 chars after 'sk-****' for frontend display. Does NOT decrypt."""
    try:
        plain = decrypt_api_key(encrypted)
    except Exception:
        return "****"
    if len(plain) <= 4:
        return "****"
    return f"sk-****{plain[-4:]}"
