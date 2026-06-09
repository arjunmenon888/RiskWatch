from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlayerProgress(Base):
    __tablename__ = "player_progress"
    __table_args__ = (UniqueConstraint("player_id", "game_id", name="uq_player_progress_game"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    current_level_id: Mapped[int | None] = mapped_column(ForeignKey("game_levels.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="in_progress", nullable=False)
    completed_level_ids: Mapped[list[int]] = mapped_column(JSON, default=list, nullable=False)
    last_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class LevelAttempt(Base):
    __tablename__ = "level_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    level_id: Mapped[int] = mapped_column(ForeignKey("game_levels.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="in_progress", nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PlayerAnswer(Base):
    __tablename__ = "player_answers"
    __table_args__ = (UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("level_attempts.id", ondelete="CASCADE"), index=True, nullable=False)
    question_id: Mapped[str] = mapped_column(String(120), nullable=False)
    selected_answer: Mapped[str] = mapped_column(String(40), nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(40), nullable=False)
    is_correct: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
