from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GameBlueprint(Base):
    __tablename__ = "game_blueprints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    total_levels: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    topic_order: Mapped[list[int]] = mapped_column(JSON, default=list, nullable=False)
    difficulty_distribution: Mapped[dict[str, int]] = mapped_column(JSON, default=dict, nullable=False)
    reward_style: Mapped[str] = mapped_column(String(120), default="XP + badges", nullable=False)
    branching_style: Mapped[str] = mapped_column(String(160), default="pass/fail with review paths", nullable=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    game = relationship("Game", back_populates="blueprint")
