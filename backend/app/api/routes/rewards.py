from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.reward import PlayerReward
from app.models.user import User
from app.schemas.reward import BranchResolutionRead, CompleteLevelRequest, GameRewardSummaryRead
from app.services.publishing import active_publication, active_publications, snapshot_level, snapshot_levels

router = APIRouter(prefix="/api/player", tags=["player-rewards"])


@router.get("/games/{game_id}/rewards", response_model=GameRewardSummaryRead)
def get_rewards_summary(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameRewardSummaryRead:
    publication = active_publication(game_id, db)
    if publication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published game not found.")
    earned_rewards = _earned_rewards(current_user.id, game_id, db)
    badges = [reward.badge_name for reward in earned_rewards if reward.badge_name]
    return GameRewardSummaryRead(
        game_id=game_id,
        earned_xp=sum(reward.xp for reward in earned_rewards),
        total_available_xp=sum(_level_available_xp(level) for level in snapshot_levels(publication)),
        badges=badges,
        earned_rewards=earned_rewards,
    )


@router.post("/levels/{level_id}/next", response_model=BranchResolutionRead)
def resolve_next_level(
    level_id: int,
    payload: CompleteLevelRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> BranchResolutionRead:
    publication, level = _published_level_with_version(level_id, db)
    branch = _select_branch(level, payload.score)
    return _resolve_branch(publication, level, branch, payload.score)


def _earned_rewards(player_id: int, game_id: int, db: Session) -> list[PlayerReward]:
    return list(
        db.scalars(
            select(PlayerReward)
            .where(PlayerReward.player_id == player_id, PlayerReward.game_id == game_id)
            .order_by(PlayerReward.earned_at.desc(), PlayerReward.id.desc())
        )
    )


def _select_branch(level: dict, score: int) -> dict:
    branching = level.get("branching_suggestion", {}) if isinstance(level.get("branching_suggestion"), dict) else {}
    branches = branching.get("branches", [])
    if not isinstance(branches, list):
        branches = []

    high_score = _matching_branch(branches, "high_score", score)
    if high_score is not None:
        return high_score
    low_score = _matching_branch(branches, "low_score", score)
    if low_score is not None:
        return low_score
    condition = "pass" if score >= int(level.get("pass_score", 70)) else "fail"
    branch = next((item for item in branches if isinstance(item, dict) and item.get("condition") == condition), None)
    if isinstance(branch, dict):
        return branch
    return {
        "label": "Pass path" if condition == "pass" else "Fail path",
        "condition": condition,
        "target_type": "next_level" if condition == "pass" else "review_path",
        "target_level_id": None,
    }


def _matching_branch(branches: list, condition: str, score: int) -> dict | None:
    for branch in branches:
        if not isinstance(branch, dict) or branch.get("condition") != condition:
            continue
        min_score = branch.get("min_score")
        max_score = branch.get("max_score")
        if min_score is not None and score < int(min_score):
            continue
        if max_score is not None and score > int(max_score):
            continue
        return branch
    return None


def _resolve_branch(publication, level: dict, branch: dict, score: int) -> BranchResolutionRead:
    target_type = str(branch.get("target_type", "review_path"))
    target_level = _target_level(publication, level, branch) if target_type == "next_level" else None
    level_id = int(level["id"])
    level_title = str(level.get("title", "Current Level"))
    if target_type == "retry_current":
        return BranchResolutionRead(
            action="retry_current",
            branch_label=str(branch.get("label") or "Retry current level"),
            target_level_id=level_id,
            target_level_title=level_title,
            message="Replay this level and try again.",
        )
    if target_type == "review_path":
        return BranchResolutionRead(
            action="review_path",
            branch_label=str(branch.get("label") or "Review path"),
            target_level_id=level_id,
            target_level_title=level_title,
            message="Review the explanation before retrying.",
        )
    if target_type == "end_game" or target_level is None:
        return BranchResolutionRead(
            action="end_game",
            branch_label=str(branch.get("label") or "End game"),
            target_level_id=None,
            target_level_title=None,
            message="No next approved level is available.",
        )
    return BranchResolutionRead(
        action="next_level",
        branch_label=str(branch.get("label") or ("Pass path" if score >= int(level.get("pass_score", 70)) else "Score path")),
        target_level_id=int(target_level["id"]),
        target_level_title=str(target_level.get("title", "Next Level")),
        message="Continue to the next level.",
    )


def _target_level(publication, level: dict, branch: dict) -> dict | None:
    target_level_id = branch.get("target_level_id")
    if isinstance(target_level_id, int):
        return snapshot_level(publication, target_level_id)
    sequence_number = int(level.get("sequence_number", 1))
    return next(
        (
            candidate
            for candidate in snapshot_levels(publication)
            if isinstance(candidate, dict) and int(candidate.get("sequence_number", 0)) > sequence_number
        ),
        None,
    )


def _published_level_with_version(level_id: int, db: Session):
    for publication in active_publications(db):
        level = snapshot_level(publication, level_id)
        if level is not None:
            return publication, level
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published level not found.")


def _reward_xp(reward: dict) -> int:
    value = reward.get("xp", 0)
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return 0


def _level_available_xp(level: dict) -> int:
    questions = level.get("questions", []) if isinstance(level.get("questions"), list) else []
    question_xp = sum(_question_xp(question) for question in questions if isinstance(question, dict))
    return question_xp if question_xp > 0 else _reward_xp(level.get("reward", {}))


def _question_xp(question: dict) -> int:
    try:
        return max(0, int(question.get("xp", 0)))
    except (TypeError, ValueError):
        return 0
