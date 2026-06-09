from __future__ import annotations

import os
import time

import httpx
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.models.blueprint import GameBlueprint
from app.models.game import Game
from app.models.level import GameLevel
from app.models.reward import PlayerReward
from app.models.topic import Topic
from app.models.user import User
from scripts.smoke_auth import create_test_user_headers

BASE_URL = os.getenv("PHASE_SMOKE_BASE_URL", "http://127.0.0.1:8004")


def main() -> None:
    stamp = int(time.time())
    creator_email = f"phase9creator{stamp}@example.com"
    player_email = f"phase9player{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            creator_headers = signup(client, creator_email, "creator")
            player_headers = signup(client, player_email, "player")
            game = client.post(
                f"{BASE_URL}/creator/games",
                headers=creator_headers,
                json={
                    "title": "Branching Safety",
                    "description": "branching smoke",
                    "category": "Safety",
                    "visibility": "private",
                },
            )
            game.raise_for_status()
            game_id = game.json()["id"]
            seed_topics_and_blueprint(game_id)

            first = generate_and_approve(client, creator_headers, game_id)
            second = generate_and_approve(client, creator_headers, game_id)
            print("levels", first["id"], second["id"])

            invalid = client.patch(
                f"{BASE_URL}/api/games/{game_id}/levels/{first['id']}",
                headers=creator_headers,
                json={"branching_suggestion": branch_payload(target_level_id=999999)},
            )
            print("invalid_branch", invalid.status_code)

            updated = client.patch(
                f"{BASE_URL}/api/games/{game_id}/levels/{first['id']}",
                headers=creator_headers,
                json={"branching_suggestion": branch_payload(target_level_id=second["id"])},
            )
            updated.raise_for_status()
            print("update_branch", updated.status_code, len(updated.json()["branching_suggestion"]["branches"]))

            approved = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{first['id']}/approve", headers=creator_headers)
            approved.raise_for_status()
            print("approve_branch", approved.status_code, approved.json()["status"])

            high = client.post(f"{BASE_URL}/api/player/levels/{first['id']}/next", headers=player_headers, json={"score": 95})
            high.raise_for_status()
            high_payload = high.json()
            print("high_score", high.status_code, high_payload["action"], high_payload["target_level_id"])

            passing = client.post(f"{BASE_URL}/api/player/levels/{first['id']}/next", headers=player_headers, json={"score": 80})
            passing.raise_for_status()
            passing_payload = passing.json()
            print("pass", passing.status_code, passing_payload["action"], passing_payload["target_level_id"])

            low = client.post(f"{BASE_URL}/api/player/levels/{first['id']}/next", headers=player_headers, json={"score": 40})
            low.raise_for_status()
            print("low_score", low.status_code, low.json()["action"])

            fail = client.post(f"{BASE_URL}/api/player/levels/{first['id']}/next", headers=player_headers, json={"score": 70})
            fail.raise_for_status()
            print("fail", fail.status_code, fail.json()["action"])
    finally:
        cleanup(creator_email, player_email, game_id)


def signup(client: httpx.Client, email: str, role: str) -> dict[str, str]:
    return create_test_user_headers(email, f"Phase Nine {role.title()}")


def seed_topics_and_blueprint(game_id: int) -> None:
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
                source_chunk_ids=[501],
                difficulty="intermediate",
                recommended_level_count=1,
                selected=True,
                sort_order=0,
            ),
            Topic(
                game_id=game_id,
                document_id=None,
                title="Emergency Response",
                summary="Escalate emergencies through safe response paths.",
                source_chunk_ids=[502],
                difficulty="beginner",
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
            title="Branching Safety Quest",
            description="Approved blueprint for branching smoke testing.",
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


def generate_and_approve(client: httpx.Client, headers: dict[str, str], game_id: int) -> dict:
    generated = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=headers, json={"game_id": game_id})
    generated.raise_for_status()
    level = generated.json()
    approved = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/approve", headers=headers)
    approved.raise_for_status()
    return approved.json()


def branch_payload(target_level_id: int) -> dict:
    return {
        "style": "structured pass/fail score paths",
        "success_path": "Pass to the next level.",
        "review_path": "Review and retry.",
        "branches": [
            {
                "id": "pass-next",
                "label": "Pass path",
                "condition": "pass",
                "target_type": "next_level",
                "target_level_id": target_level_id,
                "min_score": None,
                "max_score": None,
                "description": "Continue to the selected next level.",
            },
            {
                "id": "fail-review",
                "label": "Fail path",
                "condition": "fail",
                "target_type": "review_path",
                "target_level_id": None,
                "min_score": None,
                "max_score": None,
                "description": "Review the explanation before retrying.",
            },
            {
                "id": "advanced",
                "label": "Advanced path",
                "condition": "high_score",
                "target_type": "next_level",
                "target_level_id": target_level_id,
                "min_score": 90,
                "max_score": None,
                "description": "High scorers continue directly.",
            },
            {
                "id": "remedial",
                "label": "Remedial path",
                "condition": "low_score",
                "target_type": "retry_current",
                "target_level_id": None,
                "min_score": None,
                "max_score": 50,
                "description": "Low scorers retry this level.",
            },
        ],
    }


def cleanup(creator_email: str, player_email: str, game_id: int | None) -> None:
    with SessionLocal() as db:
        if game_id is not None:
            db.execute(delete(PlayerReward).where(PlayerReward.game_id == game_id))
            db.execute(delete(GameLevel).where(GameLevel.game_id == game_id))
            db.execute(delete(GameBlueprint).where(GameBlueprint.game_id == game_id))
            db.execute(delete(Topic).where(Topic.game_id == game_id))
            db.execute(delete(Game).where(Game.id == game_id))
        db.execute(delete(User).where(User.email.in_([creator_email, player_email])))
        db.commit()


if __name__ == "__main__":
    main()
