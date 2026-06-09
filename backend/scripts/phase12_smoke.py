from __future__ import annotations

import os
import time

import httpx
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.certificate import PlayerCertificate
from app.models.game import Game
from app.models.publishing import PublishedGameVersion, PublishedPlayerProgress
from app.models.user import User
from scripts.smoke_auth import create_test_user_headers

BASE_URL = os.getenv("PHASE_SMOKE_BASE_URL", "http://127.0.0.1:8004")


def main() -> None:
    stamp = int(time.time())
    creator_email = f"phase12creator{stamp}@example.com"
    player_email = f"phase12player{stamp}@example.com"
    game_id: int | None = None

    try:
        with httpx.Client(timeout=20) as client:
            creator_headers = signup(client, creator_email, "creator")
            player_headers = signup(client, player_email, "player")
            game_response = client.post(
                f"{BASE_URL}/creator/games",
                headers=creator_headers,
                json={
                    "title": "Certificate Safety Quest",
                    "description": "Phase 12 certificate smoke test.",
                    "category": "Safety",
                    "visibility": "public",
                },
            )
            game_response.raise_for_status()
            game_id = game_response.json()["id"]
            seed_publication_and_progress(game_id, player_email)

            blocked = client.post(
                f"{BASE_URL}/api/player/games/{game_id}/certificates",
                headers=player_headers,
            )
            assert blocked.status_code == 409
            print("incomplete_game_blocked", blocked.status_code)

            complete_progress(game_id, player_email)
            issued = client.post(
                f"{BASE_URL}/api/player/games/{game_id}/certificates",
                headers=player_headers,
            )
            issued.raise_for_status()
            certificate = issued.json()
            assert certificate["game_title"] == "Certificate Safety Quest"
            assert certificate["certificate_number"].startswith("RW-")
            print("certificate_issued", issued.status_code, certificate["certificate_number"])

            duplicate = client.post(
                f"{BASE_URL}/api/player/games/{game_id}/certificates",
                headers=player_headers,
            )
            duplicate.raise_for_status()
            assert duplicate.json()["id"] == certificate["id"]
            assert certificate_count(game_id) == 1
            print("certificate_idempotent", duplicate.status_code, duplicate.json()["id"])

            listed = client.get(f"{BASE_URL}/api/player/certificates", headers=player_headers)
            listed.raise_for_status()
            assert [item["id"] for item in listed.json()] == [certificate["id"]]
            print("certificate_listed", listed.status_code, len(listed.json()))

            pdf = client.get(
                f"{BASE_URL}/api/player/certificates/{certificate['id']}/download",
                headers=player_headers,
            )
            pdf.raise_for_status()
            assert pdf.headers["content-type"].startswith("application/pdf")
            assert pdf.content.startswith(b"%PDF-1.4")
            assert len(pdf.content) > 800
            print("certificate_pdf", pdf.status_code, len(pdf.content))
    finally:
        cleanup(creator_email, player_email, game_id)


def signup(client: httpx.Client, email: str, role: str) -> dict[str, str]:
    return create_test_user_headers(email, f"Phase Twelve {role.title()}")


def seed_publication_and_progress(game_id: int, player_email: str) -> None:
    with SessionLocal() as db:
        game = db.get(Game, game_id)
        player = db.scalar(select(User).where(User.email == player_email))
        if game is None or player is None:
            raise RuntimeError("Phase 12 fixture users or game were not created.")
        publication = PublishedGameVersion(
            game_id=game.id,
            version_number=1,
            snapshot={
                "game": {
                    "id": game.id,
                    "title": game.title,
                    "description": game.description,
                    "category": game.category,
                    "creator_id": game.creator_id,
                    "certificate_settings": {"enabled": True, "template": "standard"},
                },
                "levels": [{"id": 1201, "title": "Certificate-ready level"}],
            },
            is_active=True,
        )
        db.add(publication)
        db.flush()
        db.add(
            PublishedPlayerProgress(
                player_id=player.id,
                game_id=game.id,
                publication_id=publication.id,
                status="in_progress",
                completed_level_ids=[],
            )
        )
        db.commit()


def complete_progress(game_id: int, player_email: str) -> None:
    with SessionLocal() as db:
        player = db.scalar(select(User).where(User.email == player_email))
        if player is None:
            raise RuntimeError("Phase 12 player was not found.")
        progress = db.scalar(
            select(PublishedPlayerProgress).where(
                PublishedPlayerProgress.player_id == player.id,
                PublishedPlayerProgress.game_id == game_id,
            )
        )
        if progress is None:
            raise RuntimeError("Phase 12 progress was not found.")
        progress.status = "completed"
        progress.completed_level_ids = [1201]
        db.add(progress)
        db.commit()


def certificate_count(game_id: int) -> int:
    with SessionLocal() as db:
        return len(list(db.scalars(select(PlayerCertificate).where(PlayerCertificate.game_id == game_id))))


def cleanup(creator_email: str, player_email: str, game_id: int | None) -> None:
    with SessionLocal() as db:
        if game_id is not None:
            db.execute(delete(PlayerCertificate).where(PlayerCertificate.game_id == game_id))
            db.execute(delete(PublishedPlayerProgress).where(PublishedPlayerProgress.game_id == game_id))
            db.execute(delete(PublishedGameVersion).where(PublishedGameVersion.game_id == game_id))
            db.execute(delete(Game).where(Game.id == game_id))
        db.execute(delete(User).where(User.email.in_([creator_email, player_email])))
        db.commit()


if __name__ == "__main__":
    main()
