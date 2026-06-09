from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.blueprint import GameBlueprint
from app.models.document import DocumentChunk
from app.models.game import Game
from app.models.level import GameLevel
from app.models.topic import Topic
from app.models.user import User
from app.schemas.level import (
    GenerateNextLevelRequest,
    LevelCreate,
    LevelRead,
    LevelReorderRequest,
    LevelUpdate,
    LockLevelRequest,
    RegenerateLevelRequest,
)
from app.services.ai.level_generation import generate_level

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])
levels_router = APIRouter(prefix="/api/games/{game_id}/levels", tags=["levels"])


@ai_router.post("/generate-next-level", response_model=LevelRead, status_code=status.HTTP_201_CREATED)
def generate_next_level(
    payload: GenerateNextLevelRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    game = _get_owned_game(payload.game_id, current_user, db)
    blueprint = db.scalar(select(GameBlueprint).where(GameBlueprint.game_id == game.id))
    if blueprint is None or not blueprint.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Approve a blueprint before generating levels.")

    existing_levels = _levels_for_game(game.id, db)
    blocking_level = next((level for level in existing_levels if level.status != "approved"), None)
    if blocking_level is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Approve the current level before generating the next one.")

    next_topic = _next_topic(game.id, blueprint, existing_levels, db)
    if next_topic is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All selected blueprint topics already have generated levels.")

    source_chunks = list(
        db.scalars(select(DocumentChunk).where(DocumentChunk.id.in_(next_topic.source_chunk_ids)).order_by(DocumentChunk.id.asc()))
    )
    sequence_number = len(existing_levels) + 1
    generated = generate_level(next_topic, sequence_number, blueprint, source_chunks, existing_levels)

    level = GameLevel(
        game_id=game.id,
        topic_id=next_topic.id,
        creator_id=current_user.id,
        sequence_number=sequence_number,
        title=generated.title,
        learning_objective=generated.learning_objective,
        topic_explanation=generated.topic_explanation,
        difficulty=generated.difficulty,
        scenarios=generated.scenarios,
        questions=generated.questions,
        reward=generated.reward,
        pass_score=generated.pass_score,
        branching_suggestion=generated.branching_suggestion,
        source_chunk_ids=generated.source_chunk_ids,
        status="under_review",
        generation_context=generated.generation_context,
    )
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@levels_router.get("", response_model=list[LevelRead])
def list_levels(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[GameLevel]:
    _get_owned_game(game_id, current_user, db)
    return _levels_for_game(game_id, db)


@levels_router.post("", response_model=LevelRead, status_code=status.HTTP_201_CREATED)
def create_level(
    game_id: int,
    payload: LevelCreate,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    game = _get_owned_game(game_id, current_user, db)
    levels = _levels_for_game(game_id, db)
    insert_at = min(payload.insert_at, len(levels) + 1)
    topic = _topic_for_new_level(game_id, insert_at, levels, db)
    for level in reversed(levels):
        if level.sequence_number >= insert_at:
            level.sequence_number += 1
            db.add(level)
    level = GameLevel(
        game_id=game.id,
        topic_id=topic.id,
        creator_id=current_user.id,
        sequence_number=insert_at,
        title=payload.title,
        learning_objective="Describe the learning objective for this level.",
        topic_explanation="Add the source-grounded explanation for this level.",
        difficulty="beginner",
        scenarios=[],
        questions=[],
        reward={"xp": 0, "badge": "New Level Badge", "style": "Question XP"},
        pass_score=70,
        branching_suggestion={
            "style": "pass/fail with review paths",
            "success_path": "Continue to the next approved level.",
            "review_path": "Review this level and retry.",
            "branches": [
                {
                    "id": f"branch-new-{insert_at}-pass",
                    "label": "Pass path",
                    "condition": "pass",
                    "target_type": "next_level",
                    "target_level_id": None,
                    "min_score": None,
                    "max_score": None,
                    "description": "Move to the next level.",
                },
                {
                    "id": f"branch-new-{insert_at}-fail",
                    "label": "Fail path",
                    "condition": "fail",
                    "target_type": "review_path",
                    "target_level_id": None,
                    "min_score": None,
                    "max_score": None,
                    "description": "Review and retry this level.",
                },
            ],
        },
        source_chunk_ids=topic.source_chunk_ids,
        status="under_review",
        generation_context={"created_manually": True},
    )
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@levels_router.post("/reorder", response_model=list[LevelRead])
def reorder_levels(
    game_id: int,
    payload: LevelReorderRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[GameLevel]:
    _get_owned_game(game_id, current_user, db)
    levels = _levels_for_game(game_id, db)
    existing_ids = [level.id for level in levels]
    if len(payload.level_ids) != len(existing_ids) or set(payload.level_ids) != set(existing_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Level order must include every level in this game exactly once.",
        )
    level_by_id = {level.id: level for level in levels}
    for sequence_number, level_id in enumerate(payload.level_ids, start=1):
        level_by_id[level_id].sequence_number = sequence_number
        db.add(level_by_id[level_id])
    db.commit()
    return _levels_for_game(game_id, db)


@levels_router.patch("/{level_id}", response_model=LevelRead)
def update_level(
    game_id: int,
    level_id: int,
    payload: LevelUpdate,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    _get_owned_game(game_id, current_user, db)
    level = _get_level(game_id, level_id, db)
    edited_fields = payload.model_dump(exclude_unset=True)
    for field, value in edited_fields.items():
        setattr(level, field, value)
    if "branching_suggestion" in edited_fields:
        _validate_branching(level, db)
    if edited_fields and level.status in {"approved", "published"} and "status" not in edited_fields:
        level.status = "under_review"
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@levels_router.post("/{level_id}/approve", response_model=LevelRead)
def approve_level(
    game_id: int,
    level_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    _get_owned_game(game_id, current_user, db)
    level = _get_level(game_id, level_id, db)
    _validate_level_for_approval(level)
    _validate_branching(level, db)
    level.status = "approved"
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@levels_router.post("/{level_id}/clone", response_model=LevelRead, status_code=status.HTTP_201_CREATED)
def clone_level(
    game_id: int,
    level_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    game = _get_owned_game(game_id, current_user, db)
    level = _get_level(game_id, level_id, db)
    next_sequence = len(_levels_for_game(game_id, db)) + 1
    cloned = GameLevel(
        game_id=game.id,
        topic_id=level.topic_id,
        creator_id=current_user.id,
        sequence_number=next_sequence,
        title=f"Copy of {level.title}",
        learning_objective=level.learning_objective,
        topic_explanation=level.topic_explanation,
        difficulty=level.difficulty,
        scenarios=level.scenarios,
        questions=level.questions,
        reward=level.reward,
        pass_score=level.pass_score,
        branching_suggestion=level.branching_suggestion,
        source_chunk_ids=level.source_chunk_ids,
        status="under_review",
        locked_from_ai_changes=False,
        generation_context={**level.generation_context, "cloned_from_level_id": level.id},
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned


@levels_router.post("/{level_id}/lock", response_model=LevelRead)
def lock_level(
    game_id: int,
    level_id: int,
    payload: LockLevelRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    _get_owned_game(game_id, current_user, db)
    level = _get_level(game_id, level_id, db)
    level.locked_from_ai_changes = payload.locked
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@levels_router.post("/{level_id}/regenerate", response_model=LevelRead)
def regenerate_level(
    game_id: int,
    level_id: int,
    payload: RegenerateLevelRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameLevel:
    _get_owned_game(game_id, current_user, db)
    level = _get_level(game_id, level_id, db)
    if level.locked_from_ai_changes:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unlock this level before regenerating AI content.")

    topic = db.get(Topic, level.topic_id)
    if topic is None or topic.game_id != game_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Level topic not found.")
    blueprint = db.scalar(select(GameBlueprint).where(GameBlueprint.game_id == game_id))
    source_chunks = list(
        db.scalars(select(DocumentChunk).where(DocumentChunk.id.in_(topic.source_chunk_ids)).order_by(DocumentChunk.id.asc()))
    )
    previous_levels = [item for item in _levels_for_game(game_id, db) if item.id != level.id]
    generated = generate_level(topic, level.sequence_number, blueprint, source_chunks, previous_levels)
    _apply_regenerated_section(level, generated, payload.section)
    level.status = "under_review"
    level.generation_context = {
        **generated.generation_context,
        "regenerated_section": payload.section,
        "previous_generation_context": level.generation_context,
    }
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@levels_router.delete("/{level_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_level(
    game_id: int,
    level_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    _get_owned_game(game_id, current_user, db)
    level = _get_level(game_id, level_id, db)
    db.delete(level)
    db.commit()
    _resequence_levels(game_id, db)


def _get_owned_game(game_id: int, current_user: User, db: Session) -> Game:
    game = db.get(Game, game_id)
    if game is None or game.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game


def _get_level(game_id: int, level_id: int, db: Session) -> GameLevel:
    level = db.get(GameLevel, level_id)
    if level is None or level.game_id != game_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Level not found.")
    return level


def _levels_for_game(game_id: int, db: Session) -> list[GameLevel]:
    return list(db.scalars(select(GameLevel).where(GameLevel.game_id == game_id).order_by(GameLevel.sequence_number.asc())))


def _next_topic(
    game_id: int,
    blueprint: GameBlueprint,
    existing_levels: list[GameLevel],
    db: Session,
) -> Topic | None:
    generated_topic_ids = {level.topic_id for level in existing_levels}
    ordered_topic_ids = [topic_id for topic_id in blueprint.topic_order if topic_id not in generated_topic_ids]
    if not ordered_topic_ids:
        return None
    topic = db.get(Topic, ordered_topic_ids[0])
    if topic is None or topic.game_id != game_id or not topic.selected:
        return None
    return topic


def _topic_for_new_level(game_id: int, insert_at: int, levels: list[GameLevel], db: Session) -> Topic:
    adjacent = next((level for level in levels if level.sequence_number >= insert_at), None)
    if adjacent is None and levels:
        adjacent = levels[-1]
    if adjacent is not None:
        topic = db.get(Topic, adjacent.topic_id)
        if topic is not None:
            return topic
    topic = db.scalar(select(Topic).where(Topic.game_id == game_id).order_by(Topic.sort_order.asc(), Topic.id.asc()))
    if topic is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Add a topic before creating a level.")
    return topic


def _apply_regenerated_section(level: GameLevel, generated, section: str) -> None:
    if section in {"all", "settings"}:
        level.title = generated.title
        level.learning_objective = generated.learning_objective
        level.difficulty = generated.difficulty
        level.pass_score = generated.pass_score
        level.source_chunk_ids = generated.source_chunk_ids
    if section in {"all", "explanation"}:
        level.topic_explanation = generated.topic_explanation
    if section in {"all", "scenarios"}:
        level.scenarios = generated.scenarios
    if section in {"all", "questions"}:
        level.questions = generated.questions
    if section in {"all", "reward"}:
        level.reward = generated.reward
    if section in {"all", "branching"}:
        level.branching_suggestion = generated.branching_suggestion


def _validate_level_for_approval(level: GameLevel) -> None:
    missing: list[str] = []
    if not level.title.strip():
        missing.append("title")
    if not level.learning_objective.strip():
        missing.append("learning objective")
    if not level.topic_explanation.strip():
        missing.append("topic explanation")
    if not level.scenarios:
        missing.append("scenario")
    if not level.questions:
        missing.append("question")
    if not level.reward:
        missing.append("reward")
    for index, scenario in enumerate(level.scenarios, start=1):
        if not str(scenario.get("prompt", "")).strip():
            missing.append(f"scenario {index} prompt")
    for index, question in enumerate(level.questions, start=1):
        if not str(question.get("prompt", "")).strip():
            missing.append(f"question {index} prompt")
        if not question.get("options"):
            missing.append(f"question {index} options")
        if not str(question.get("correct_answer", "")).strip():
            missing.append(f"question {index} correct answer")
        feedback = question.get("feedback")
        if not isinstance(feedback, dict) or not str(feedback.get("correct", "")).strip() or not str(feedback.get("incorrect", "")).strip():
            missing.append(f"question {index} feedback")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Level is incomplete: {', '.join(missing)}.",
        )


def _validate_branching(level: GameLevel, db: Session) -> None:
    branches = level.branching_suggestion.get("branches", [])
    if branches is None:
        return
    if not isinstance(branches, list):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Branches must be a list.")

    allowed_conditions = {"pass", "fail", "high_score", "low_score", "review"}
    allowed_targets = {"next_level", "retry_current", "review_path", "end_game"}
    for index, branch in enumerate(branches, start=1):
        if not isinstance(branch, dict):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} must be an object.")
        condition = str(branch.get("condition", "")).strip()
        target_type = str(branch.get("target_type", "")).strip()
        if condition not in allowed_conditions:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} has an invalid condition.")
        if target_type not in allowed_targets:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} has an invalid target type.")
        min_score = branch.get("min_score")
        max_score = branch.get("max_score")
        if min_score is not None and (not isinstance(min_score, int) or min_score < 0 or min_score > 100):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} has an invalid minimum score.")
        if max_score is not None and (not isinstance(max_score, int) or max_score < 0 or max_score > 100):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} has an invalid maximum score.")
        if min_score is not None and max_score is not None and min_score > max_score:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} has an invalid score range.")
        target_level_id = branch.get("target_level_id")
        if target_level_id is None:
            continue
        if not isinstance(target_level_id, int):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} target level must be a number.")
        if target_level_id == level.id and target_type != "retry_current":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} cannot point back to the same level.")
        target_level = db.get(GameLevel, target_level_id)
        if target_level is None or target_level.game_id != level.game_id:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Branch {index} target level does not exist in this game.")


def _resequence_levels(game_id: int, db: Session) -> None:
    levels = _levels_for_game(game_id, db)
    for index, level in enumerate(levels, start=1):
        level.sequence_number = index
        db.add(level)
    db.commit()
