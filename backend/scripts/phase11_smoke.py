from __future__ import annotations

import os
import time

import httpx
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.blueprint import GameBlueprint
from app.models.game import Game
from app.models.gameplay import LevelAttempt, PlayerAnswer
from app.models.level import GameLevel
from app.models.publishing import AttemptPublicationPin, PublishedGameVersion, PublishedPlayerProgress
from app.models.reward import PlayerReward
from app.models.topic import Topic
from app.models.user import User
from scripts.smoke_auth import create_test_user_headers

BASE_URL = os.getenv("PHASE_SMOKE_BASE_URL", "http://127.0.0.1:8004")


def main() -> None:
    stamp = int(time.time())
    creator_email = f"phase11creator{stamp}@example.com"
    player_one_email = f"phase11playerone{stamp}@example.com"
    player_two_email = f"phase11playertwo{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            creator_headers = signup(client, creator_email, "creator")
            player_one_headers = signup(client, player_one_email, "player")
            player_two_headers = signup(client, player_two_email, "player")
            game_response = client.post(
                f"{BASE_URL}/creator/games",
                headers=creator_headers,
                json={
                    "title": "Versioned Safety Quest",
                    "description": "Publishing snapshot smoke test.",
                    "category": "Safety",
                    "visibility": "public",
                },
            )
            game_response.raise_for_status()
            game_id = game_response.json()["id"]

            validation = client.get(
                f"{BASE_URL}/api/games/{game_id}/publishing/validate",
                headers=creator_headers,
            )
            validation.raise_for_status()
            assert validation.json()["can_publish"] is False
            blocked_publish = client.post(
                f"{BASE_URL}/api/games/{game_id}/publishing/publish",
                headers=creator_headers,
            )
            assert blocked_publish.status_code == 422
            print("validation_blocks_incomplete_game", validation.status_code, blocked_publish.status_code)

            seed_topics_and_blueprint(game_id)
            first_level = generate_and_approve(client, creator_headers, game_id)
            generate_and_approve(client, creator_headers, game_id)

            preview = client.get(
                f"{BASE_URL}/api/games/{game_id}/publishing/preview",
                headers=creator_headers,
            )
            preview.raise_for_status()
            assert preview.json()["validation"]["can_publish"] is True
            assert len(preview.json()["levels"]) == 2
            print("preview_ready", preview.status_code, len(preview.json()["levels"]))

            version_one = client.post(
                f"{BASE_URL}/api/games/{game_id}/publishing/publish",
                headers=creator_headers,
            )
            version_one.raise_for_status()
            assert version_one.json()["version"]["version_number"] == 1
            print("publish_v1", version_one.status_code, version_one.json()["version"]["version_number"])

            player_one_start = client.post(
                f"{BASE_URL}/api/player/games/{game_id}/start",
                headers=player_one_headers,
            )
            player_one_start.raise_for_status()
            original_title = player_one_start.json()["level"]["title"]

            edited_title = f"{original_title} - Revised Draft"
            edited = client.patch(
                f"{BASE_URL}/api/games/{game_id}/levels/{first_level['id']}",
                headers=creator_headers,
                json={"title": edited_title},
            )
            edited.raise_for_status()
            assert edited.json()["status"] == "under_review"

            stable_progress = client.get(
                f"{BASE_URL}/api/player/games/{game_id}/progress",
                headers=player_one_headers,
            )
            stable_progress.raise_for_status()
            assert stable_progress.json()["level"]["title"] == original_title
            print("draft_edit_keeps_v1_stable", stable_progress.status_code, original_title)

            approved = client.post(
                f"{BASE_URL}/api/games/{game_id}/levels/{first_level['id']}/approve",
                headers=creator_headers,
            )
            approved.raise_for_status()
            version_two = client.post(
                f"{BASE_URL}/api/games/{game_id}/publishing/publish",
                headers=creator_headers,
            )
            version_two.raise_for_status()
            assert version_two.json()["version"]["version_number"] == 2

            player_two_start = client.post(
                f"{BASE_URL}/api/player/games/{game_id}/start",
                headers=player_two_headers,
            )
            player_two_start.raise_for_status()
            assert player_two_start.json()["level"]["title"] == edited_title
            assert_only_version_two_active(game_id)
            print("publish_v2", version_two.status_code, player_two_start.json()["level"]["title"])

            unpublished = client.post(
                f"{BASE_URL}/api/games/{game_id}/publishing/unpublish",
                headers=creator_headers,
            )
            unpublished.raise_for_status()
            assert unpublished.json()["is_active"] is False
            player_games = client.get(f"{BASE_URL}/api/player/games", headers=player_two_headers)
            player_games.raise_for_status()
            assert game_id not in {game["id"] for game in player_games.json()}
            print("unpublish_hides_game", unpublished.status_code, len(player_games.json()))
    finally:
        cleanup(creator_email, player_one_email, player_two_email, game_id)


def signup(client: httpx.Client, email: str, role: str) -> dict[str, str]:
    return create_test_user_headers(email, f"Phase Eleven {role.title()}")


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
                source_chunk_ids=[701],
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
                source_chunk_ids=[702],
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
        db.add(
            GameBlueprint(
                game_id=game_id,
                creator_id=game.creator_id,
                title="Versioned Safety Quest",
                description="Approved blueprint for publishing smoke testing.",
                total_levels=2,
                estimated_duration_minutes=12,
                topic_order=[topic.id for topic in topics],
                difficulty_distribution={"beginner": 1, "intermediate": 1, "advanced": 0},
                reward_style="XP + badges",
                branching_style="pass/fail with review paths",
                approved=True,
            )
        )
        db.commit()


def generate_and_approve(client: httpx.Client, headers: dict[str, str], game_id: int) -> dict:
    generated = client.post(f"{BASE_URL}/api/ai/generate-next-level", headers=headers, json={"game_id": game_id})
    generated.raise_for_status()
    level = generated.json()
    approved = client.post(f"{BASE_URL}/api/games/{game_id}/levels/{level['id']}/approve", headers=headers)
    approved.raise_for_status()
    return approved.json()


def assert_only_version_two_active(game_id: int) -> None:
    with SessionLocal() as db:
        versions = list(
            db.scalars(
                select(PublishedGameVersion)
                .where(PublishedGameVersion.game_id == game_id)
                .order_by(PublishedGameVersion.version_number.asc())
            )
        )
        assert [version.version_number for version in versions] == [1, 2]
        assert versions[0].is_active is False
        assert versions[1].is_active is True


def cleanup(creator_email: str, player_one_email: str, player_two_email: str, game_id: int | None) -> None:
    with SessionLocal() as db:
        if game_id is not None:
            attempt_ids = list(db.scalars(select(LevelAttempt.id).where(LevelAttempt.game_id == game_id)))
            if attempt_ids:
                db.execute(delete(PlayerAnswer).where(PlayerAnswer.attempt_id.in_(attempt_ids)))
                db.execute(delete(AttemptPublicationPin).where(AttemptPublicationPin.attempt_id.in_(attempt_ids)))
            db.execute(delete(LevelAttempt).where(LevelAttempt.game_id == game_id))
            db.execute(delete(PublishedPlayerProgress).where(PublishedPlayerProgress.game_id == game_id))
            db.execute(delete(PlayerReward).where(PlayerReward.game_id == game_id))
            db.execute(delete(PublishedGameVersion).where(PublishedGameVersion.game_id == game_id))
            db.execute(delete(GameLevel).where(GameLevel.game_id == game_id))
            db.execute(delete(GameBlueprint).where(GameBlueprint.game_id == game_id))
            db.execute(delete(Topic).where(Topic.game_id == game_id))
            db.execute(delete(Game).where(Game.id == game_id))
        db.execute(delete(User).where(User.email.in_([creator_email, player_one_email, player_two_email])))
        db.commit()


if __name__ == "__main__":
    main()
