from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return f"pbkdf2_sha256${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt_value, digest_value = password_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    salt = base64.urlsafe_b64decode(salt_value.encode())
    expected_digest = base64.urlsafe_b64decode(digest_value.encode())
    actual_digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return hmac.compare_digest(actual_digest, expected_digest)


def generate_password_reset_token() -> str:
    return secrets.token_urlsafe(48)


def hash_password_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": subject,
        "exp": int(expires_at.timestamp()),
        "ver": 2,
        "iss": "riskwatch",
    }
    return _encode_token(payload)


def decode_access_token(token: str) -> dict[str, Any] | None:
    parts = token.split(".")
    if len(parts) != 3:
        return None

    signing_input = f"{parts[0]}.{parts[1]}".encode("utf-8")
    expected_signature = _sign(signing_input)
    if not hmac.compare_digest(parts[2], expected_signature):
        return None

    try:
        payload = json.loads(_base64url_decode(parts[1]).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None

    if int(payload.get("exp", 0)) < int(datetime.now(UTC).timestamp()):
        return None
    if payload.get("ver") != 2 or payload.get("iss") != "riskwatch":
        return None

    return payload


def _encode_token(payload: dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = _sign(signing_input)
    return f"{encoded_header}.{encoded_payload}.{signature}"


def _sign(message: bytes) -> str:
    digest = hmac.new(settings.secret_key.encode("utf-8"), message, hashlib.sha256).digest()
    return _base64url_encode(digest)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))
