from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

GameVisibility = Literal["private", "unlisted", "public"]
GameStatus = Literal["draft", "published", "archived"]
GameCreationMode = Literal["ai", "manual"]


class GameBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="General", min_length=2, max_length=80)
    visibility: GameVisibility = "private"
    creation_mode: GameCreationMode = "ai"


class GameCreate(GameBase):
    pass


class GameUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    visibility: GameVisibility | None = None
    status: GameStatus | None = None
    creation_mode: GameCreationMode | None = None


class GameRead(GameBase):
    id: int
    creator_id: int
    status: GameStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
