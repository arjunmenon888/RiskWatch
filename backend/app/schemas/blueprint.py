from datetime import datetime

from pydantic import BaseModel, Field


class CreateBlueprintRequest(BaseModel):
    game_id: int
    replace_existing: bool = True


class BlueprintRead(BaseModel):
    id: int
    game_id: int
    creator_id: int
    title: str
    description: str
    total_levels: int
    estimated_duration_minutes: int
    topic_order: list[int]
    difficulty_distribution: dict[str, int]
    reward_style: str
    branching_style: str
    approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BlueprintUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, min_length=3, max_length=3000)
    total_levels: int | None = Field(default=None, ge=1, le=60)
    estimated_duration_minutes: int | None = Field(default=None, ge=1, le=240)
    topic_order: list[int] | None = None
    difficulty_distribution: dict[str, int] | None = None
    reward_style: str | None = Field(default=None, min_length=3, max_length=120)
    branching_style: str | None = Field(default=None, min_length=3, max_length=160)
