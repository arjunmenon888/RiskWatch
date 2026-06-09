from datetime import datetime

from pydantic import BaseModel, Field


class CompleteLevelRequest(BaseModel):
    score: int = Field(ge=0, le=100)


class EarnedRewardRead(BaseModel):
    id: int
    player_id: int
    game_id: int
    level_id: int
    xp: int
    badge_name: str | None
    score: int
    earned_at: datetime

    model_config = {"from_attributes": True}


class GameRewardSummaryRead(BaseModel):
    game_id: int
    earned_xp: int
    total_available_xp: int
    badges: list[str]
    earned_rewards: list[EarnedRewardRead]


class BranchResolutionRead(BaseModel):
    action: str
    branch_label: str
    target_level_id: int | None
    target_level_title: str | None
    message: str
