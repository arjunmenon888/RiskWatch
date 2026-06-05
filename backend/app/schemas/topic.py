from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TopicDifficulty = Literal["beginner", "intermediate", "advanced"]


class TopicRead(BaseModel):
    id: int
    game_id: int
    document_id: int | None
    title: str
    summary: str
    source_chunk_ids: list[int]
    difficulty: TopicDifficulty
    recommended_level_count: int
    selected: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExtractTopicsRequest(BaseModel):
    game_id: int
    document_id: int | None = None
    replace_existing: bool = True


class TopicUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    summary: str | None = Field(default=None, min_length=3, max_length=2000)
    difficulty: TopicDifficulty | None = None
    recommended_level_count: int | None = Field(default=None, ge=1, le=12)
    selected: bool | None = None
    sort_order: int | None = Field(default=None, ge=0)


class TopicReorderRequest(BaseModel):
    topic_ids: list[int] = Field(min_length=1)
