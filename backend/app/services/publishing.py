from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.level import GameLevel
from app.models.publishing import PublishedGameVersion


def active_publication(game_id: int, db: Session) -> PublishedGameVersion | None:
    return db.scalar(
        select(PublishedGameVersion)
        .where(PublishedGameVersion.game_id == game_id, PublishedGameVersion.is_active.is_(True))
        .order_by(PublishedGameVersion.version_number.desc())
    )


def active_publications(db: Session) -> list[PublishedGameVersion]:
    return list(
        db.scalars(
            select(PublishedGameVersion)
            .where(PublishedGameVersion.is_active.is_(True))
            .order_by(PublishedGameVersion.published_at.desc(), PublishedGameVersion.id.desc())
        )
    )


def snapshot_levels(publication: PublishedGameVersion) -> list[dict]:
    levels = publication.snapshot.get("levels", [])
    return levels if isinstance(levels, list) else []


def snapshot_level(publication: PublishedGameVersion, level_id: int) -> dict | None:
    return next(
        (
            level
            for level in snapshot_levels(publication)
            if isinstance(level, dict) and level.get("id") == level_id
        ),
        None,
    )


def first_snapshot_level(publication: PublishedGameVersion) -> dict | None:
    levels = snapshot_levels(publication)
    return levels[0] if levels else None


def build_snapshot(game: Game, levels: list[GameLevel]) -> dict:
    return {
        "game": {
            "id": game.id,
            "creator_id": game.creator_id,
            "title": game.title,
            "description": game.description,
            "category": game.category,
            "visibility": game.visibility,
            "status": "published",
        },
        "levels": [
            {
                "id": level.id,
                "game_id": level.game_id,
                "topic_id": level.topic_id,
                "sequence_number": level.sequence_number,
                "title": level.title,
                "learning_objective": level.learning_objective,
                "topic_explanation": level.topic_explanation,
                "difficulty": level.difficulty,
                "scenarios": level.scenarios,
                "questions": level.questions,
                "reward": level.reward,
                "pass_score": level.pass_score,
                "branching_suggestion": level.branching_suggestion,
                "source_chunk_ids": level.source_chunk_ids,
            }
            for level in levels
        ],
    }
