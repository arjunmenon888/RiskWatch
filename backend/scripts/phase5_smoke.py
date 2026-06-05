from __future__ import annotations

import time

import httpx
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.models.blueprint import GameBlueprint
from app.models.game import Game
from app.models.topic import Topic
from app.models.user import User

BASE_URL = "http://127.0.0.1:8004"


def main() -> None:
    stamp = int(time.time())
    owner_email = f"phase5owner{stamp}@example.com"
    other_email = f"phase5other{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            owner_headers = signup(client, owner_email)
            other_headers = signup(client, other_email)
            game = client.post(
                f"{BASE_URL}/creator/games",
                headers=owner_headers,
                json={
                    "title": "Workplace Safety",
                    "description": "blueprint smoke",
                    "category": "Safety",
                    "visibility": "private",
                    "creation_mode": "ai",
                },
            )
            game.raise_for_status()
            game_id = game.json()["id"]
            seed_topics(game_id)

            created = client.post(
                f"{BASE_URL}/api/ai/create-blueprint",
                headers=owner_headers,
                json={"game_id": game_id, "replace_existing": True},
            )
            created.raise_for_status()
            blueprint = created.json()
            print("create", created.status_code, blueprint["approved"], blueprint["total_levels"], blueprint["topic_order"])

            fetched = client.get(f"{BASE_URL}/api/games/{game_id}/blueprint", headers=owner_headers)
            fetched.raise_for_status()
            print("get", fetched.status_code, fetched.json()["title"])

            updated = client.patch(
                f"{BASE_URL}/api/games/{game_id}/blueprint",
                headers=owner_headers,
                json={"title": "Edited Safety Quest", "estimated_duration_minutes": 35},
            )
            updated.raise_for_status()
            print("update", updated.status_code, updated.json()["title"], updated.json()["approved"])

            approved = client.post(f"{BASE_URL}/api/games/{game_id}/blueprint/approve", headers=owner_headers)
            approved.raise_for_status()
            print("approve", approved.status_code, approved.json()["approved"])

            other_get = client.get(f"{BASE_URL}/api/games/{game_id}/blueprint", headers=other_headers)
            print("other_get", other_get.status_code)
    finally:
        cleanup(owner_email, other_email, game_id)


def signup(client: httpx.Client, email: str) -> dict[str, str]:
    response = client.post(
        f"{BASE_URL}/auth/signup",
        json={"email": email, "full_name": "Phase Five", "password": "password123", "role": "creator"},
    )
    response.raise_for_status()
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def seed_topics(game_id: int) -> None:
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
                source_chunk_ids=[101],
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
                source_chunk_ids=[102],
                difficulty="intermediate",
                recommended_level_count=2,
                selected=True,
                sort_order=1,
            ),
            Topic(
                game_id=game_id,
                document_id=None,
                title="Advanced Risk Control",
                summary="Apply layered risk controls to complex work.",
                source_chunk_ids=[103],
                difficulty="advanced",
                recommended_level_count=3,
                selected=False,
                sort_order=2,
            ),
        ]
        db.add_all(topics)
        db.commit()


def cleanup(owner_email: str, other_email: str, game_id: int | None) -> None:
    with SessionLocal() as db:
        if game_id is not None:
            db.execute(delete(GameBlueprint).where(GameBlueprint.game_id == game_id))
            db.execute(delete(Topic).where(Topic.game_id == game_id))
            db.execute(delete(Game).where(Game.id == game_id))
        db.execute(delete(User).where(User.email.in_([owner_email, other_email])))
        db.commit()


if __name__ == "__main__":
    main()
