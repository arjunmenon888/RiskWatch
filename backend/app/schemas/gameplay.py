from datetime import datetime

from pydantic import BaseModel

from app.schemas.certificate import CertificateRead
from app.schemas.reward import BranchResolutionRead, EarnedRewardRead


class PlayableGameRead(BaseModel):
    id: int
    title: str
    description: str
    category: str
    creator_id: int
    level_count: int
    status: str


class PlayerProgressRead(BaseModel):
    id: int
    player_id: int
    game_id: int
    current_level_id: int | None
    status: str
    completed_level_ids: list[int]
    last_score: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlayableQuestionRead(BaseModel):
    id: str
    prompt: str
    options: list[dict]
    xp: int


class PlayableLevelRead(BaseModel):
    id: int
    game_id: int
    sequence_number: int
    title: str
    learning_objective: str
    topic_explanation: str
    difficulty: str
    scenarios: list[dict]
    questions: list[PlayableQuestionRead]
    reward: dict
    pass_score: int
    branching_suggestion: dict


class GameplayStartRead(BaseModel):
    progress: PlayerProgressRead
    level: PlayableLevelRead


class LevelAttemptRead(BaseModel):
    id: int
    player_id: int
    game_id: int
    level_id: int
    status: str
    score: int | None
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class StartAttemptRead(BaseModel):
    attempt: LevelAttemptRead
    level: PlayableLevelRead


class SubmitAnswerRequest(BaseModel):
    question_id: str
    selected_answer: str


class SubmitAnswerRead(BaseModel):
    question_id: str
    selected_answer: str
    is_correct: bool
    feedback: dict


class CompleteAttemptRead(BaseModel):
    attempt: LevelAttemptRead
    score: int
    passed: bool
    reward: EarnedRewardRead | None
    branch: BranchResolutionRead
    progress: PlayerProgressRead
    certificate: CertificateRead | None = None
