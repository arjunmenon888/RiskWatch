from __future__ import annotations

import os
import time

import httpx
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.blueprint import GameBlueprint
from app.models.game import Game
from app.models.gameplay import LevelAttempt, PlayerAnswer, PlayerProgress
from app.models.level import GameLevel
from app.models.publishing import AttemptPublicationPin, PublishedGameVersion, PublishedPlayerProgress
from app.models.reward import PlayerReward
from app.models.topic import Topic
from app.models.user import User
from scripts.smoke_auth import create_test_user_headers

BASE_URL = os.getenv("PHASE_SMOKE_BASE_URL", "http://127.0.0.1:8004")


def main() -> None:
    stamp = int(time.time())
    creator_email = f"phase10creator{stamp}@example.com"
    player_email = f"phase10player{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            creator_headers = signup(client, creator_email, "creator")
            player_headers = signup(client, player_email, "player")
            game = client.post(
                f"{BASE_URL}/creator/games",
                headers=creator_headers,
                json={
                    "title": "Playable Safety Quest",
                    "description": "Gameplay engine smoke test.",
                    "category": "Safety",
                    "visibility": "public",
                },
            )
            game.raise_for_status()
            game_id = game.json()["id"]
            seed_topics_and_blueprint(game_id)

            first = generate_and_approve(client, creator_headers, game_id)
            second = generate_and_approve(client, creator_headers, game_id)
            published = client.post(
                f"{BASE_URL}/api/games/{game_id}/publishing/publish",
                headers=creator_headers,
            )
            published.raise_for_status()
            print("publish_setup", published.status_code, published.json()["version"]["version_number"])

            games = client.get(f"{BASE_URL}/api/player/games", headers=player_headers)
            games.raise_for_status()
            print("browse", games.status_code, len(games.json()))

            started = client.post(f"{BASE_URL}/api/player/games/{game_id}/start", headers=player_headers)
            started.raise_for_status()
            session = started.json()
            playable_level = session["level"]
            correct_hidden = all("correct_answer" not in question for question in playable_level["questions"])
            print("start", started.status_code, playable_level["id"], correct_hidden)

            rewards_before = client.get(
                f"{BASE_URL}/api/player/games/{game_id}/rewards",
                headers=player_headers,
            )
            rewards_before.raise_for_status()
            assert rewards_before.json()["earned_xp"] == 0
            print(
                "rewards_before",
                rewards_before.status_code,
                rewards_before.json()["earned_xp"],
                rewards_before.json()["total_available_xp"],
            )

            direct_claim = client.post(
                f"{BASE_URL}/api/player/levels/{playable_level['id']}/complete",
                headers=player_headers,
                json={"score": 100},
            )
            assert direct_claim.status_code == 404
            print("direct_claim_removed", direct_claim.status_code)

            attempt_response = client.post(
                f"{BASE_URL}/api/player/levels/{playable_level['id']}/attempts",
                headers=player_headers,
            )
            attempt_response.raise_for_status()
            attempt_id = attempt_response.json()["attempt"]["id"]

            for question in first["questions"]:
                answer = client.post(
                    f"{BASE_URL}/api/player/attempts/{attempt_id}/answers",
                    headers=player_headers,
                    json={"question_id": question["id"], "selected_answer": question["correct_answer"]},
                )
                answer.raise_for_status()
                print("answer", answer.status_code, answer.json()["is_correct"])

            completed = client.post(f"{BASE_URL}/api/player/attempts/{attempt_id}/complete", headers=player_headers)
            completed.raise_for_status()
            result = completed.json()
            print(
                "complete",
                completed.status_code,
                result["score"],
                result["passed"],
                result["reward"]["xp"],
                result["branch"]["action"],
                result["branch"]["target_level_id"],
            )

            rewards_after = client.get(
                f"{BASE_URL}/api/player/games/{game_id}/rewards",
                headers=player_headers,
            )
            rewards_after.raise_for_status()
            assert rewards_after.json()["earned_xp"] == result["reward"]["xp"]
            print(
                "rewards_after",
                rewards_after.status_code,
                rewards_after.json()["earned_xp"],
                len(rewards_after.json()["badges"]),
            )

            progress = client.get(f"{BASE_URL}/api/player/games/{game_id}/progress", headers=player_headers)
            progress.raise_for_status()
            print(
                "resume",
                progress.status_code,
                progress.json()["progress"]["current_level_id"],
                progress.json()["level"]["id"] == second["id"],
            )
    finally:
        cleanup(creator_email, player_email, game_id)


def signup(client: httpx.Client, email: str, role: str) -> dict[str, str]:
    return create_test_user_headers(email, f"Phase Ten {role.title()}")


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
                source_chunk_ids=[601],
                difficulty="beginner",
                recommended_level_count=1,
                selected=True,
                sort_order=0,
            ),
            Topic(
                game_id=game_id,
                document_id=None,
                title="Emergency Response",
                summary="Escalate emergencies through safe response paths.",
                source_chunk_ids=[602],
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
            title="Playable Safety Quest",
            description="Approved blueprint for gameplay smoke testing.",
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


def cleanup(creator_email: str, player_email: str, game_id: int | None) -> None:
    with SessionLocal() as db:
        if game_id is not None:
            attempt_ids = list(db.scalars(select(LevelAttempt.id).where(LevelAttempt.game_id == game_id)))
            if attempt_ids:
                db.execute(delete(PlayerAnswer).where(PlayerAnswer.attempt_id.in_(attempt_ids)))
                db.execute(delete(AttemptPublicationPin).where(AttemptPublicationPin.attempt_id.in_(attempt_ids)))
            db.execute(delete(LevelAttempt).where(LevelAttempt.game_id == game_id))
            db.execute(delete(PlayerProgress).where(PlayerProgress.game_id == game_id))
            db.execute(delete(PublishedPlayerProgress).where(PublishedPlayerProgress.game_id == game_id))
            db.execute(delete(PlayerReward).where(PlayerReward.game_id == game_id))
            db.execute(delete(PublishedGameVersion).where(PublishedGameVersion.game_id == game_id))
            db.execute(delete(GameLevel).where(GameLevel.game_id == game_id))
            db.execute(delete(GameBlueprint).where(GameBlueprint.game_id == game_id))
            db.execute(delete(Topic).where(Topic.game_id == game_id))
            db.execute(delete(Game).where(Game.id == game_id))
        db.execute(delete(User).where(User.email.in_([creator_email, player_email])))
        db.commit()


if __name__ == "__main__":
    main()
