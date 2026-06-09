from __future__ import annotations

import time

import httpx
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.models.blueprint import GameBlueprint
from app.models.game import Game
from app.models.level import GameLevel
from app.models.topic import Topic
from app.models.user import User
from scripts.smoke_auth import create_test_user_headers

BASE_URL = "http://127.0.0.1:8004"


def main() -> None:
    stamp = int(time.time())
    owner_email = f"phase6owner{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            headers = signup(client, owner_email)
            game = client.post(
                f"{BASE_URL}/creator/games",
                headers=headers,
                json={
                    "title": "Level Generation Safety",
                    "description": "level generation smoke",
                    "category": "Safety",
                    "visibility": "private",
                },
            )
            game.raise_for_status()
            game_id = game.json()["id"]
            topic_ids = seed_topics_and_blueprint(game_id)

            first = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=headers, json={"game_id": game_id})
            first.raise_for_status()
            first_level = first.json()
            print("first", first.status_code, first_level["status"], first_level["topic_id"], len(first_level["questions"]))

            blocked = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=headers, json={"game_id": game_id})
            print("blocked", blocked.status_code)

            approved = client.post(
                f"{BASE_URL}/api/games/{game_id}/levels/{first_level['id']}/approve",
                headers=headers,
            )
            approved.raise_for_status()
            print("approve", approved.status_code, approved.json()["status"])

            second = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=headers, json={"game_id": game_id})
            second.raise_for_status()
            second_level = second.json()
            print("second", second.status_code, second_level["status"], second_level["topic_id"])
            print("topic_order", topic_ids)

            levels = client.get(f"{BASE_URL}/api/games/{game_id}/levels", headers=headers)
            levels.raise_for_status()
            print("list", levels.status_code, len(levels.json()))
    finally:
        cleanup(owner_email, game_id)


def signup(client: httpx.Client, email: str) -> dict[str, str]:
    return create_test_user_headers(email, "Phase Six")


def seed_topics_and_blueprint(game_id: int) -> list[int]:
    with SessionLocal() as db:
        game = db.get(Game, game_id)
        if game is None:
            raise RuntimeError("Game was not created.")
        topics = [
            Topic(
                game_id=game_id,
                document_id=None,
                title="Hazard Identification",
                summary="Identify workplace hazards before incidents happen.",
                source_chunk_ids=[201],
                difficulty="beginner",
                recommended_level_count=1,
                selected=True,
                sort_order=0,
            ),
            Topic(
                game_id=game_id,
                document_id=None,
                title="Emergency Response",
                summary="Respond to emergencies with safe escalation paths.",
                source_chunk_ids=[202],
                difficulty="intermediate",
                recommended_level_count=1,
                selected=True,
                sort_order=1,
            ),
        ]
        db.add_all(topics)
        db.commit()
        for topic in topics:
            db.refresh(topic)
        blueprint = GameBlueprint(
            game_id=game_id,
            creator_id=game.creator_id,
            title="Level Generation Safety Quest",
            description="Approved blueprint for level generation smoke testing.",
            total_levels=2,
            estimated_duration_minutes=12,
            topic_order=[topic.id for topic in topics],
            difficulty_distribution={"beginner": 1, "intermediate": 1, "advanced": 0},
            reward_style="XP + badges",
            branching_style="pass/fail with review paths",
            approved=True,
        )
        db.add(blueprint)
        db.commit()
        return [topic.id for topic in topics]


def cleanup(owner_email: str, game_id: int | None) -> None:
    with SessionLocal() as db:
        if game_id is not None:
            db.execute(delete(GameLevel).where(GameLevel.game_id == game_id))
            db.execute(delete(GameBlueprint).where(GameBlueprint.game_id == game_id))
            db.execute(delete(Topic).where(Topic.game_id == game_id))
            db.execute(delete(Game).where(Game.id == game_id))
        db.execute(delete(User).where(User.email == owner_email))
        db.commit()


if __name__ == "__main__":
    main()
