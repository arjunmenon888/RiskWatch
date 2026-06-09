from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

LevelStatus = Literal["generated", "under_review", "approved", "published"]
RegenerateSection = Literal["all", "settings", "explanation", "scenarios", "questions", "reward", "branching"]


class GenerateNextLevelRequest(BaseModel):
    game_id: int


class LevelCreate(BaseModel):
    insert_at: int = Field(ge=1)
    title: str = Field(default="New Level", min_length=1, max_length=180)


class LevelReorderRequest(BaseModel):
    level_ids: list[int] = Field(min_length=1)


class LevelUpdate(BaseModel):
    title: str | None = None
    learning_objective: str | None = None
    topic_explanation: str | None = None
    difficulty: str | None = None
    scenarios: list[dict] | None = None
    questions: list[dict] | None = None
    reward: dict | None = None
    pass_score: int | None = Field(default=None, ge=1, le=100)
    branching_suggestion: dict | None = None
    source_chunk_ids: list[int] | None = None
    status: LevelStatus | None = None


class LockLevelRequest(BaseModel):
    locked: bool


class RegenerateLevelRequest(BaseModel):
    section: RegenerateSection = "all"


class LevelRead(BaseModel):
    id: int
    game_id: int
    topic_id: int
    creator_id: int
    sequence_number: int
    title: str
    learning_objective: str
    topic_explanation: str
    difficulty: str
    scenarios: list[dict]
    questions: list[dict]
    reward: dict
    pass_score: int
    branching_suggestion: dict
    source_chunk_ids: list[int]
    status: LevelStatus
    locked_from_ai_changes: bool
    generation_context: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
