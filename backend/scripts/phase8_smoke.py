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
    creator_email = f"phase8creator{stamp}@example.com"
    player_email = f"phase8player{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            creator_headers = signup(client, creator_email, "creator")
            player_headers = signup(client, player_email, "player")
            game = client.post(
                f"{BASE_URL}/creator/games",
                headers=creator_headers,
                json={
                    "title": "Reward System Safety",
                    "description": "reward smoke",
                    "category": "Safety",
                    "visibility": "private",
                },
            )
            game.raise_for_status()
            game_id = game.json()["id"]
            seed_topic_and_blueprint(game_id)

            generated = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=creator_headers, json={"game_id": game_id})
            generated.raise_for_status()
            level = generated.json()
            print("generate", generated.status_code, level["reward"]["xp"], level["reward"]["badge"])

            approved = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/approve", headers=creator_headers)
            approved.raise_for_status()
            approved_level = approved.json()
            print("approve", approved.status_code, approved_level["status"], approved_level["pass_score"])

            summary = client.get(f"{BASE_URL}/api/player/rewards", headers=player_headers)
            summary.raise_for_status()
            summary_payload = summary.json()
            print("summary_before", summary.status_code, summary_payload["total_xp"], len(summary_payload["available_rewards"]))

            failed = client.post(
                f"{BASE_URL}/api/player/levels/{level['id']}/complete",
                headers=player_headers,
                json={"score": approved_level["pass_score"] - 1},
            )
            print("fail_score", failed.status_code)

            earned = client.post(
                f"{BASE_URL}/api/player/levels/{level['id']}/complete",
                headers=player_headers,
                json={"score": approved_level["pass_score"]},
            )
            earned.raise_for_status()
            earned_payload = earned.json()
            print("earn", earned.status_code, earned_payload["xp"], earned_payload["badge_name"])

            duplicate = client.post(
                f"{BASE_URL}/api/player/levels/{level['id']}/complete",
                headers=player_headers,
                json={"score": 100},
            )
            duplicate.raise_for_status()
            print("duplicate", duplicate.status_code, duplicate.json()["id"] == earned_payload["id"])

            after = client.get(f"{BASE_URL}/api/player/rewards", headers=player_headers)
            after.raise_for_status()
            after_payload = after.json()
            print("summary_after", after.status_code, after_payload["total_xp"], len(after_payload["badges"]))
    finally:
        cleanup(creator_email, player_email, game_id)


def signup(client: httpx.Client, email: str, role: str) -> dict[str, str]:
    return create_test_user_headers(email, f"Phase Eight {role.title()}")


def seed_topic_and_blueprint(game_id: int) -> None:
    with SessionLocal() as db:
        game = db.get(Game, game_id)
        if game is None:
            raise RuntimeError("Game was not created.")
        topic = Topic(
            game_id=game_id,
            document_id=None,
            title="Rewarded Hazard Identification",
            summary="Identify workplace hazards before incidents happen.",
            source_chunk_ids=[401],
            difficulty="intermediate",
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
            title="Reward System Safety Quest",
            description="Approved blueprint for reward system smoke testing.",
            total_levels=1,
            estimated_duration_minutes=8,
            topic_order=[topic.id],
            difficulty_distribution={"beginner": 0, "intermediate": 1, "advanced": 0},
            reward_style="XP + badges",
            branching_style="pass/fail with review paths",
            approved=True,
        )
        db.add(blueprint)
        db.commit()


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
