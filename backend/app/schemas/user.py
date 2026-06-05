from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role_player: bool
    role_creator: bool
    role_admin: bool

    model_config = {"from_attributes": True}

