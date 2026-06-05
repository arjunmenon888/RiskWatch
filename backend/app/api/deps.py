from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if credentials is None:
        raise _credentials_exception()

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _credentials_exception()

    user_id = payload.get("sub")
    if user_id is None:
        raise _credentials_exception()

    user = db.get(User, int(user_id))
    if user is None:
        raise _credentials_exception()

    return user


def require_player(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role_player or current_user.role_creator or current_user.role_admin:
        return current_user
    raise _forbidden("Player access is required.")


def require_creator(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role_creator or current_user.role_admin:
        return current_user
    raise _forbidden("Creator access is required.")


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role_admin:
        return current_user
    raise _forbidden("Admin access is required.")


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

