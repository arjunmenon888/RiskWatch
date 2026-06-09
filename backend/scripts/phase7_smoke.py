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
    owner_email = f"phase7owner{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            headers = signup(client, owner_email)
            game = client.post(
                f"{BASE_URL}/creator/games",
                headers=headers,
                json={
                    "title": "Level Editor Safety",
                    "description": "level editor smoke",
                    "category": "Safety",
                    "visibility": "private",
                },
            )
            game.raise_for_status()
            game_id = game.json()["id"]
            seed_topics_and_blueprint(game_id)

            generated = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=headers, json={"game_id": game_id})
            generated.raise_for_status()
            level = generated.json()
            print("generate", generated.status_code, level["status"], level["pass_score"], level["locked_from_ai_changes"])

            emptied = client.patch(
                f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}",
                headers=headers,
                json={"questions": []},
            )
            emptied.raise_for_status()
            blocked_approval = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/approve", headers=headers)
            print("invalid_approve", blocked_approval.status_code)

            restored = client.patch(
                f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}",
                headers=headers,
                json={
                    "title": "Edited Hazard Level",
                    "questions": level["questions"],
                    "pass_score": 85,
                },
            )
            restored.raise_for_status()
            print("update", restored.status_code, restored.json()["title"], restored.json()["pass_score"])

            locked = client.post(
                f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/lock",
                headers=headers,
                json={"locked": True},
            )
            locked.raise_for_status()
            print("lock", locked.status_code, locked.json()["locked_from_ai_changes"])

            blocked_regen = client.post(
                f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/regenerate",
                headers=headers,
                json={"section": "questions"},
            )
            print("locked_regenerate", blocked_regen.status_code)

            unlocked = client.post(
                f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/lock",
                headers=headers,
                json={"locked": False},
            )
            unlocked.raise_for_status()
            regenerated = client.post(
                f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/regenerate",
                headers=headers,
                json={"section": "questions"},
            )
            regenerated.raise_for_status()
            print("regenerate", regenerated.status_code, len(regenerated.json()["questions"]))

            approved = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/approve", headers=headers)
            approved.raise_for_status()
            print("approve", approved.status_code, approved.json()["status"])

            cloned = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/clone", headers=headers)
            cloned.raise_for_status()
            clone = cloned.json()
            print("clone", cloned.status_code, clone["status"], clone["sequence_number"])

            deleted = client.delete(f"{BASE_URL}/api/games/{game_id}/levels/{clone['id']}", headers=headers)
            print("delete", deleted.status_code)

            levels = client.get(f"{BASE_URL}/api/games/{game_id}/levels", headers=headers)
            levels.raise_for_status()
            print("list", levels.status_code, len(levels.json()))
    finally:
        cleanup(owner_email, game_id)


def signup(client: httpx.Client, email: str) -> dict[str, str]:
    return create_test_user_headers(email, "Phase Seven")


def seed_topics_and_blueprint(game_id: int) -> None:
    with SessionLocal() as db:
        game = db.get(Game, game_id)
        if game is None:
            raise RuntimeError("Game was not created.")
        topic = Topic(
            game_id=game_id,
            document_id=None,
            title="Hazard Identification",
            summary="Identify workplace hazards before incidents happen.",
            source_chunk_ids=[301],
            difficulty="beginner",
            recommended_level_count=1,
            selected=True,
            sort_order=0,
        )
        db.add(topic)
        db.commit()
        db.refresh(topic)
        blueprint = GameBlueprint(
            game_id=game_id,
            creator_id=game.creator_id,
            title="Level Editor Safety Quest",
            description="Approved blueprint for level editor smoke testing.",
            total_levels=1,
            estimated_duration_minutes=8,
            topic_order=[topic.id],
            difficulty_distribution={"beginner": 1, "intermediate": 0, "advanced": 0},
            reward_style="XP + badges",
            branching_style="pass/fail with review paths",
            approved=True,
        )
        db.add(blueprint)
        db.commit()


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
