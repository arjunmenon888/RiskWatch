from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    source_chunk_ids: Mapped[list[int]] = mapped_column(JSON, default=list, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(24), default="beginner", nullable=False)
    recommended_level_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    selected: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    game = relationship("Game", back_populates="topics")
    document = relationship("Document", back_populates="topics")
    levels = relationship("GameLevel", back_populates="topic", cascade="all, delete-orphan")
