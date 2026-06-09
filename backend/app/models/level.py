from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GameLevel(Base):
    __tablename__ = "game_levels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True, nullable=False)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    learning_objective: Mapped[str] = mapped_column(Text, nullable=False)
    topic_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(24), nullable=False)
    scenarios: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    questions: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    reward: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    pass_score: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    branching_suggestion: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    source_chunk_ids: Mapped[list[int]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="under_review", nullable=False)
    locked_from_ai_changes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    generation_context: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    game = relationship("Game", back_populates="levels")
    topic = relationship("Topic", back_populates="levels")
