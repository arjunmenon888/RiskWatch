from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.gameplay import LevelAttempt, PlayerAnswer
from app.models.publishing import AttemptPublicationPin, PublishedGameVersion, PublishedPlayerProgress
from app.models.reward import PlayerReward
from app.models.user import User
from app.services.certificates.service import certificate_eligible, issue_certificate
from app.schemas.gameplay import (
    CompleteAttemptRead,
    GameplayStartRead,
    PlayableGameRead,
    PlayableLevelRead,
    PlayableQuestionRead,
    PlayerProgressRead,
    StartAttemptRead,
    SubmitAnswerRead,
    SubmitAnswerRequest,
)
from app.schemas.reward import BranchResolutionRead
from app.services.publishing import active_publication, active_publications, first_snapshot_level, snapshot_level, snapshot_levels

router = APIRouter(prefix="/api/player", tags=["player-gameplay"])


@router.get("/games", response_model=list[PlayableGameRead])
def list_playable_games(
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[PlayableGameRead]:
    return [_playable_game(publication) for publication in active_publications(db) if snapshot_levels(publication)]


@router.post("/games/{game_id}/start", response_model=GameplayStartRead)
def start_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameplayStartRead:
    publication = _get_active_publication(game_id, db)
    first_level = first_snapshot_level(publication)
    if first_level is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No playable levels found.")

    progress = db.scalar(
        select(PublishedPlayerProgress).where(
            PublishedPlayerProgress.player_id == current_user.id,
            PublishedPlayerProgress.game_id == game_id,
        )
    )
    if progress is None:
        progress = PublishedPlayerProgress(
            player_id=current_user.id,
            game_id=game_id,
            publication_id=publication.id,
            current_level_id=int(first_level["id"]),
        )
    elif progress.status == "completed" or progress.publication_id != publication.id:
        progress.publication_id = publication.id
        progress.current_level_id = int(first_level["id"])
        progress.status = "in_progress"
        progress.completed_level_ids = []
        progress.last_score = None
    db.add(progress)
    db.commit()
    db.refresh(progress)
    level = snapshot_level(publication, progress.current_level_id or int(first_level["id"]))
    if level is None:
        level = first_level
        progress.current_level_id = int(first_level["id"])
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return GameplayStartRead(progress=PlayerProgressRead.model_validate(progress), level=_level_to_playable(level))


@router.get("/games/{game_id}/progress", response_model=GameplayStartRead)
def get_game_progress(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameplayStartRead:
    publication = _get_active_publication(game_id, db)
    progress = db.scalar(
        select(PublishedPlayerProgress).where(
            PublishedPlayerProgress.player_id == current_user.id,
            PublishedPlayerProgress.game_id == game_id,
            PublishedPlayerProgress.publication_id == publication.id,
        )
    )
    if progress is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found.")
    level = snapshot_level(publication, progress.current_level_id) if progress.current_level_id is not None else None
    if level is None:
        level = first_snapshot_level(publication)
    if level is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No playable levels found.")
    return GameplayStartRead(progress=PlayerProgressRead.model_validate(progress), level=_level_to_playable(level))


@router.post("/levels/{level_id}/attempts", response_model=StartAttemptRead, status_code=status.HTTP_201_CREATED)
def start_level_attempt(
    level_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StartAttemptRead:
    publication, level = _publication_level_for_player(current_user.id, level_id, db)
    game_id = int(level["game_id"])
    progress = _ensure_progress(current_user.id, game_id, publication, level_id, db)
    progress.current_level_id = level_id
    progress.status = "in_progress"
    attempt = LevelAttempt(player_id=current_user.id, game_id=game_id, level_id=level_id)
    db.add(progress)
    db.add(attempt)
    db.flush()
    pin = AttemptPublicationPin(
        attempt_id=attempt.id,
        publication_id=publication.id,
        level_snapshot=level,
    )
    db.add(pin)
    db.commit()
    db.refresh(attempt)
    return StartAttemptRead(attempt=attempt, level=_level_to_playable(level))


@router.post("/attempts/{attempt_id}/answers", response_model=SubmitAnswerRead)
def submit_answer(
    attempt_id: int,
    payload: SubmitAnswerRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> SubmitAnswerRead:
    attempt = _get_attempt(attempt_id, current_user.id, db)
    if attempt.status != "in_progress":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This attempt is already complete.")
    level = _attempt_level_snapshot(attempt.id, db)
    question = _question_by_id(level, payload.question_id)
    correct_answer = str(question.get("correct_answer", "")).strip()
    selected_answer = payload.selected_answer.strip()
    is_correct = selected_answer == correct_answer
    feedback = question.get("feedback") if isinstance(question.get("feedback"), dict) else {}

    existing = db.scalar(
        select(PlayerAnswer).where(
            PlayerAnswer.attempt_id == attempt.id,
            PlayerAnswer.question_id == payload.question_id,
        )
    )
    if existing is None:
        existing = PlayerAnswer(
            attempt_id=attempt.id,
            question_id=payload.question_id,
            selected_answer=selected_answer,
            correct_answer=correct_answer,
            is_correct=1 if is_correct else 0,
            feedback=feedback,
        )
    else:
        existing.selected_answer = selected_answer
        existing.correct_answer = correct_answer
        existing.is_correct = 1 if is_correct else 0
        existing.feedback = feedback
    db.add(existing)
    db.commit()
    return SubmitAnswerRead(
        question_id=payload.question_id,
        selected_answer=selected_answer,
        is_correct=is_correct,
        feedback={"message": feedback.get("correct" if is_correct else "incorrect", ""), **feedback},
    )


@router.post("/attempts/{attempt_id}/complete", response_model=CompleteAttemptRead)
def complete_attempt(
    attempt_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CompleteAttemptRead:
    attempt = _get_attempt(attempt_id, current_user.id, db)
    pin = db.scalar(select(AttemptPublicationPin).where(AttemptPublicationPin.attempt_id == attempt.id))
    if pin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published attempt snapshot not found.")
    publication = db.get(PublishedGameVersion, pin.publication_id)
    if publication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published version not found.")
    level = pin.level_snapshot
    questions = level.get("questions", []) if isinstance(level.get("questions"), list) else []
    answers = list(db.scalars(select(PlayerAnswer).where(PlayerAnswer.attempt_id == attempt.id)))
    if len({answer.question_id for answer in answers}) < len(questions):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Answer every question before completing the level.")
    correct_count = sum(1 for answer in answers if answer.is_correct)
    score = round((correct_count / len(questions)) * 100) if questions else 0
    passed = score >= int(level.get("pass_score", 70))

    attempt.status = "completed"
    attempt.score = score
    attempt.completed_at = datetime.now(timezone.utc)
    progress = _ensure_progress(current_user.id, attempt.game_id, publication, attempt.level_id, db)
    completed_level_ids = set(progress.completed_level_ids)
    if passed:
        completed_level_ids.add(attempt.level_id)
    progress.completed_level_ids = sorted(completed_level_ids)
    progress.last_score = score
    branch = _resolve_branch(publication, level, _select_branch(level, score), score)
    progress.current_level_id = branch.target_level_id
    progress.status = "completed" if branch.action == "end_game" else "in_progress"
    reward = _award_reward(current_user.id, level, answers, score, db) if passed else None
    certificate = (
        issue_certificate(current_user, progress, publication, db)
        if certificate_eligible(progress, publication)
        else None
    )

    db.add(attempt)
    db.add(progress)
    db.commit()
    db.refresh(attempt)
    db.refresh(progress)
    if reward is not None:
        db.refresh(reward)
    return CompleteAttemptRead(
        attempt=attempt,
        score=score,
        passed=passed,
        reward=reward,
        branch=branch,
        progress=progress,
        certificate=certificate,
    )


def _playable_game(publication: PublishedGameVersion) -> PlayableGameRead:
    game = publication.snapshot.get("game", {})
    return PlayableGameRead(
        id=int(game.get("id", publication.game_id)),
        title=str(game.get("title", "Untitled Game")),
        description=str(game.get("description", "")),
        category=str(game.get("category", "General")),
        creator_id=int(game.get("creator_id", 0)),
        level_count=len(snapshot_levels(publication)),
        status="published",
    )


def _get_active_publication(game_id: int, db: Session) -> PublishedGameVersion:
    publication = active_publication(game_id, db)
    if publication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published game not found.")
    return publication


def _publication_level_for_player(player_id: int, level_id: int, db: Session) -> tuple[PublishedGameVersion, dict]:
    progress = db.scalar(
        select(PublishedPlayerProgress).where(
            PublishedPlayerProgress.player_id == player_id,
            PublishedPlayerProgress.current_level_id == level_id,
        )
    )
    if progress is not None:
        publication = db.get(PublishedGameVersion, progress.publication_id)
        level = snapshot_level(publication, level_id) if publication is not None else None
        if publication is not None and publication.is_active and level is not None:
            return publication, level
    for publication in active_publications(db):
        level = snapshot_level(publication, level_id)
        if level is not None:
            return publication, level
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published level not found.")


def _level_to_playable(level: dict) -> PlayableLevelRead:
    questions = level.get("questions", []) if isinstance(level.get("questions"), list) else []
    return PlayableLevelRead(
        id=int(level["id"]),
        game_id=int(level["game_id"]),
        sequence_number=int(level.get("sequence_number", 1)),
        title=str(level.get("title", "Untitled Level")),
        learning_objective=str(level.get("learning_objective", "")),
        topic_explanation=str(level.get("topic_explanation", "")),
        difficulty=str(level.get("difficulty", "beginner")),
        scenarios=level.get("scenarios", []) if isinstance(level.get("scenarios"), list) else [],
        questions=[
            PlayableQuestionRead(
                id=str(question.get("id", f"question-{index + 1}")),
                prompt=str(question.get("prompt", "")),
                options=question.get("options", []) if isinstance(question.get("options"), list) else [],
                xp=_question_xp(question),
            )
            for index, question in enumerate(questions)
            if isinstance(question, dict)
        ],
        reward=level.get("reward", {}) if isinstance(level.get("reward"), dict) else {},
        pass_score=int(level.get("pass_score", 70)),
        branching_suggestion=level.get("branching_suggestion", {}) if isinstance(level.get("branching_suggestion"), dict) else {},
    )


def _ensure_progress(
    player_id: int,
    game_id: int,
    publication: PublishedGameVersion,
    level_id: int,
    db: Session,
) -> PublishedPlayerProgress:
    progress = db.scalar(
        select(PublishedPlayerProgress).where(
            PublishedPlayerProgress.player_id == player_id,
            PublishedPlayerProgress.game_id == game_id,
        )
    )
    if progress is None:
        progress = PublishedPlayerProgress(
            player_id=player_id,
            game_id=game_id,
            publication_id=publication.id,
            current_level_id=level_id,
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


def _get_attempt(attempt_id: int, player_id: int, db: Session) -> LevelAttempt:
    attempt = db.get(LevelAttempt, attempt_id)
    if attempt is None or attempt.player_id != player_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found.")
    return attempt


def _attempt_level_snapshot(attempt_id: int, db: Session) -> dict:
    pin = db.scalar(select(AttemptPublicationPin).where(AttemptPublicationPin.attempt_id == attempt_id))
    if pin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published attempt snapshot not found.")
    return pin.level_snapshot


def _question_by_id(level: dict, question_id: str) -> dict:
    questions = level.get("questions", []) if isinstance(level.get("questions"), list) else []
    question = next(
        (item for item in questions if isinstance(item, dict) and str(item.get("id")) == question_id),
        None,
    )
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    return question


def _award_reward(
    player_id: int,
    level: dict,
    answers: list[PlayerAnswer],
    score: int,
    db: Session,
) -> PlayerReward:
    level_id = int(level["id"])
    existing = db.scalar(
        select(PlayerReward).where(PlayerReward.player_id == player_id, PlayerReward.level_id == level_id)
    )
    if existing is not None:
        return existing
    reward_payload = level.get("reward", {}) if isinstance(level.get("reward"), dict) else {}
    reward = PlayerReward(
        player_id=player_id,
        game_id=int(level["game_id"]),
        level_id=level_id,
        xp=_earned_xp(level, answers, reward_payload),
        badge_name=_reward_badge(reward_payload),
        score=score,
    )
    db.add(reward)
    return reward


def _earned_xp(level: dict, answers: list[PlayerAnswer], reward: dict) -> int:
    questions = level.get("questions", []) if isinstance(level.get("questions"), list) else []
    explicit_question_xp = any(_question_xp(question) > 0 for question in questions if isinstance(question, dict))
    if not explicit_question_xp:
        return _reward_xp(reward)
    correct_question_ids = {answer.question_id for answer in answers if answer.is_correct}
    return sum(
        _question_xp(question)
        for question in questions
        if isinstance(question, dict) and str(question.get("id")) in correct_question_ids
    )


def _question_xp(question: dict) -> int:
    try:
        return max(0, int(question.get("xp", 0)))
    except (TypeError, ValueError):
        return 0


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
    branch = next(
        (item for item in branches if isinstance(item, dict) and item.get("condition") == condition),
        None,
    )
    return branch if isinstance(branch, dict) else {
        "label": condition.title(),
        "target_type": "next_level" if condition == "pass" else "review_path",
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


def _resolve_branch(
    publication: PublishedGameVersion,
    level: dict,
    branch: dict,
    score: int,
) -> BranchResolutionRead:
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
            message="No next published level is available.",
        )
    return BranchResolutionRead(
        action="next_level",
        branch_label=str(
            branch.get("label")
            or ("Pass path" if score >= int(level.get("pass_score", 70)) else "Score path")
        ),
        target_level_id=int(target_level["id"]),
        target_level_title=str(target_level.get("title", "Next Level")),
        message="Continue to the next level.",
    )


def _target_level(publication: PublishedGameVersion, level: dict, branch: dict) -> dict | None:
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


def _reward_xp(reward: dict) -> int:
    try:
        return max(0, int(reward.get("xp", 0)))
    except (TypeError, ValueError):
        return 0


def _reward_badge(reward: dict) -> str | None:
    badge = str(reward.get("badge", "")).strip()
    return badge or None
