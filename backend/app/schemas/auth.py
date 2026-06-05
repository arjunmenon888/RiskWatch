from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead

RoleName = Literal["player", "creator"]


class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: RoleName = "player"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RoleSelectRequest(BaseModel):
    role: RoleName


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

