from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlayerReward(Base):
    __tablename__ = "player_rewards"
    __table_args__ = (UniqueConstraint("player_id", "level_id", name="uq_player_reward_level"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    level_id: Mapped[int] = mapped_column(ForeignKey("game_levels.id", ondelete="CASCADE"), index=True, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, nullable=False)
    badge_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
