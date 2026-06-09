from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.game import Game
from app.models.level import GameLevel
from app.models.publishing import PublishedGameVersion
from app.models.user import User
from app.schemas.publishing import (
    GamePreviewRead,
    PublishCheckRead,
    PublishGameRead,
    PublishValidationRead,
    PublishedVersionRead,
)
from app.services.publishing import active_publication, build_snapshot

router = APIRouter(prefix="/api/games/{game_id}/publishing", tags=["publishing"])


@router.get("/preview", response_model=GamePreviewRead)
def preview_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GamePreviewRead:
    game = _get_owned_game(game_id, current_user, db)
    levels = _levels_for_game(game_id, db)
    validation = _validate_game(game, levels)
    return GamePreviewRead(
        game=_game_snapshot(game),
        levels=[_level_preview(level) for level in levels],
        validation=validation,
        active_version=active_publication(game_id, db),
    )


@router.get("/validate", response_model=PublishValidationRead)
def validate_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PublishValidationRead:
    game = _get_owned_game(game_id, current_user, db)
    return _validate_game(game, _levels_for_game(game_id, db))


@router.post("/publish", response_model=PublishGameRead, status_code=status.HTTP_201_CREATED)
def publish_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PublishGameRead:
    game = _get_owned_game(game_id, current_user, db)
    levels = _levels_for_game(game_id, db)
    validation = _validate_game(game, levels)
    if not validation.can_publish:
        failed = [check.label for check in validation.checks if not check.passed]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Game cannot be published: {', '.join(failed)}.",
        )

    next_version = (db.scalar(select(func.max(PublishedGameVersion.version_number)).where(PublishedGameVersion.game_id == game_id)) or 0) + 1
    db.execute(
        update(PublishedGameVersion)
        .where(PublishedGameVersion.game_id == game_id, PublishedGameVersion.is_active.is_(True))
        .values(is_active=False)
    )
    snapshot = build_snapshot(game, levels)
    snapshot["game"]["certificate_settings"] = {"enabled": True, "template": "standard"}
    version = PublishedGameVersion(
        game_id=game_id,
        version_number=next_version,
        snapshot=snapshot,
        is_active=True,
    )
    game.status = "published"
    db.add(version)
    db.add(game)
    db.commit()
    db.refresh(version)
    db.refresh(game)
    return PublishGameRead(validation=validation, version=PublishedVersionRead.model_validate(version))


@router.post("/unpublish", response_model=PublishedVersionRead)
def unpublish_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PublishedGameVersion:
    game = _get_owned_game(game_id, current_user, db)
    version = active_publication(game_id, db)
    if version is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active published version not found.")
    version.is_active = False
    game.status = "draft"
    db.add(version)
    db.add(game)
    db.commit()
    db.refresh(version)
    return version


def _get_owned_game(game_id: int, current_user: User, db: Session) -> Game:
    game = db.get(Game, game_id)
    if game is None or game.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game


def _levels_for_game(game_id: int, db: Session) -> list[GameLevel]:
    return list(
        db.scalars(
            select(GameLevel)
            .where(GameLevel.game_id == game_id)
            .order_by(GameLevel.sequence_number.asc(), GameLevel.id.asc())
        )
    )


def _validate_game(game: Game, levels: list[GameLevel]) -> PublishValidationRead:
    checks = [
        _check("title", "Game title", bool(game.title.strip()), "A game title is required."),
        _check("description", "Game description", bool(game.description.strip()), "A game description is required."),
        _check("levels", "At least one level", bool(levels), "Generate at least one level."),
        _check(
            "approved_levels",
            "All levels approved",
            bool(levels) and all(level.status == "approved" for level in levels),
            "Every level must be approved.",
        ),
        _check(
            "content",
            "Complete level content",
            bool(levels) and all(_level_content_complete(level) for level in levels),
            "Each level needs an explanation, scenario, question, answer, and feedback.",
        ),
        _check(
            "rewards",
            "Rewards configured",
            bool(levels) and all(_reward_complete(level) for level in levels),
            "Each level needs XP and a badge name.",
        ),
        _check(
            "branching",
            "Branching paths valid",
            bool(levels) and _branches_valid(levels),
            "Branch targets must point to levels in this game without invalid self-loops.",
        ),
        _check(
            "certificate",
            "Certificate settings",
            True,
            "The standard certificate template is configured for Phase 12.",
        ),
    ]
    return PublishValidationRead(game_id=game.id, can_publish=all(check.passed for check in checks), checks=checks)


def _check(key: str, label: str, passed: bool, detail: str) -> PublishCheckRead:
    return PublishCheckRead(key=key, label=label, passed=passed, detail=detail)


def _level_content_complete(level: GameLevel) -> bool:
    if not level.topic_explanation.strip() or not level.scenarios or not level.questions:
        return False
    if any(not str(scenario.get("prompt", "")).strip() for scenario in level.scenarios if isinstance(scenario, dict)):
        return False
    for question in level.questions:
        if not isinstance(question, dict):
            return False
        feedback = question.get("feedback")
        if (
            not str(question.get("prompt", "")).strip()
            or not question.get("options")
            or not str(question.get("correct_answer", "")).strip()
            or not isinstance(feedback, dict)
            or not str(feedback.get("correct", "")).strip()
            or not str(feedback.get("incorrect", "")).strip()
        ):
            return False
    return True


def _reward_complete(level: GameLevel) -> bool:
    reward = level.reward if isinstance(level.reward, dict) else {}
    try:
        xp = int(reward.get("xp", 0))
    except (TypeError, ValueError):
        return False
    return xp > 0 and bool(str(reward.get("badge", "")).strip())


def _branches_valid(levels: list[GameLevel]) -> bool:
    level_ids = {level.id for level in levels}
    allowed_conditions = {"pass", "fail", "high_score", "low_score", "review"}
    allowed_targets = {"next_level", "retry_current", "review_path", "end_game"}
    for level in levels:
        branching = level.branching_suggestion if isinstance(level.branching_suggestion, dict) else {}
        branches = branching.get("branches", [])
        if not isinstance(branches, list) or not branches:
            return False
        for branch in branches:
            if not isinstance(branch, dict):
                return False
            if branch.get("condition") not in allowed_conditions or branch.get("target_type") not in allowed_targets:
                return False
            target_level_id = branch.get("target_level_id")
            if target_level_id is not None and target_level_id not in level_ids:
                return False
            if target_level_id == level.id and branch.get("target_type") != "retry_current":
                return False
    return True


def _game_snapshot(game: Game) -> dict:
    return {
        "id": game.id,
        "title": game.title,
        "description": game.description,
        "category": game.category,
        "visibility": game.visibility,
        "status": game.status,
    }


def _level_preview(level: GameLevel) -> dict:
    return {
        "id": level.id,
        "sequence_number": level.sequence_number,
        "title": level.title,
        "status": level.status,
        "difficulty": level.difficulty,
        "question_count": len(level.questions),
        "scenario_count": len(level.scenarios),
        "reward": level.reward,
        "pass_score": level.pass_score,
    }
