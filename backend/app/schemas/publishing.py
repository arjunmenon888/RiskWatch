from datetime import datetime

from pydantic import BaseModel


class PublishCheckRead(BaseModel):
    key: str
    label: str
    passed: bool
    detail: str


class PublishValidationRead(BaseModel):
    game_id: int
    can_publish: bool
    checks: list[PublishCheckRead]


class PublishedVersionRead(BaseModel):
    id: int
    game_id: int
    version_number: int
    is_active: bool
    published_at: datetime

    model_config = {"from_attributes": True}


class PublishGameRead(BaseModel):
    validation: PublishValidationRead
    version: PublishedVersionRead


class GamePreviewRead(BaseModel):
    game: dict
    levels: list[dict]
    validation: PublishValidationRead
    active_version: PublishedVersionRead | None
