from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: int
    email: EmailStr
    name: str
    profile_image: str | None
    provider: str
    email_verified: bool
    role: str

    model_config = {"from_attributes": True}
