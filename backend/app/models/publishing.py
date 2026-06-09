from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PublishedGameVersion(Base):
    __tablename__ = "published_game_versions"
    __table_args__ = (UniqueConstraint("game_id", "version_number", name="uq_published_game_version"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PublishedPlayerProgress(Base):
    __tablename__ = "published_player_progress"
    __table_args__ = (UniqueConstraint("player_id", "game_id", name="uq_published_player_progress"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    publication_id: Mapped[int] = mapped_column(ForeignKey("published_game_versions.id", ondelete="CASCADE"), index=True, nullable=False)
    current_level_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="in_progress", nullable=False)
    completed_level_ids: Mapped[list[int]] = mapped_column(JSON, default=list, nullable=False)
    last_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AttemptPublicationPin(Base):
    __tablename__ = "attempt_publication_pins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("level_attempts.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    publication_id: Mapped[int] = mapped_column(ForeignKey("published_game_versions.id", ondelete="CASCADE"), index=True, nullable=False)
    level_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
