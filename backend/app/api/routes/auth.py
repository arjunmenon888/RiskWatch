from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RoleSelectRequest, SignupRequest, TokenResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role_player=True,
        role_creator=payload.role == "creator",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    return _token_response(user)


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/me", response_model=UserRead)
def current_user(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user


@router.post("/role", response_model=UserRead)
def select_role(
    payload: RoleSelectRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    current_user.role_player = True
    if payload.role == "creator":
        current_user.role_creator = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(str(user.id)), user=UserRead.model_validate(user))

