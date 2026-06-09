from datetime import UTC, datetime, timedelta
import logging

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_password_reset_token,
    hash_password,
    hash_password_reset_token,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

GENERIC_RESET_MESSAGE = "If an eligible account exists, password reset instructions have been sent."


@router.post("/google", response_model=TokenResponse)
def google_auth(
    payload: GoogleAuthRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured.",
        )

    try:
        claims = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed.",
        ) from None

    email = str(claims.get("email", "")).strip().lower()
    google_sub = str(claims.get("sub", "")).strip()
    if not email or not google_sub or claims.get("email_verified") is not True:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed.",
        )

    user = db.scalar(
        select(User).where((User.google_sub == google_sub) | (User.email == email))
    )
    if user is None:
        user = User(
            email=email,
            name=str(claims.get("name") or email.split("@", 1)[0]),
            profile_image=_optional_string(claims.get("picture")),
            provider="google",
            google_sub=google_sub,
            email_verified=True,
            role="creator_player",
        )
    else:
        if user.google_sub and user.google_sub != google_sub:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already linked to another Google account.",
            )
        user.email = email
        user.name = str(claims.get("name") or user.name)
        user.profile_image = _optional_string(claims.get("picture"))
        user.provider = "google"
        user.google_sub = google_sub
        user.email_verified = True
        user.role = "creator_player"

    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is not None:
        token = generate_password_reset_token()
        user.reset_password_token_hash = hash_password_reset_token(token)
        user.reset_password_expires_at = datetime.now(UTC) + timedelta(
            minutes=settings.password_reset_expire_minutes
        )
        db.add(user)
        db.commit()
        reset_link = f"{settings.frontend_url.rstrip('/')}?reset_token={token}"
        if settings.email_delivery_enabled:
            logger.warning("Email delivery is enabled but no email provider is configured.")
        else:
            logger.warning("Development password reset link for %s: %s", user.email, reset_link)
    return MessageResponse(message=GENERIC_RESET_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    token_hash = hash_password_reset_token(payload.token)
    user = db.scalar(
        select(User).where(User.reset_password_token_hash == token_hash)
    )
    now = datetime.now(UTC)
    if (
        user is None
        or user.reset_password_expires_at is None
        or _as_utc(user.reset_password_expires_at) <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or expired.",
        )

    user.password_hash = hash_password(payload.new_password)
    user.reset_password_token_hash = None
    user.reset_password_expires_at = None
    db.add(user)
    db.commit()
    return MessageResponse(message="Your password has been reset.")


@router.get("/me", response_model=UserRead)
def current_user(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        user=UserRead.model_validate(user),
    )


def _optional_string(value: object) -> str | None:
    return str(value) if value else None


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
