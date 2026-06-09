from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(String(80), default="General", nullable=False)
    visibility: Mapped[str] = mapped_column(String(20), default="private", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator = relationship("User", back_populates="games")
    documents = relationship("Document", back_populates="game", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="game", cascade="all, delete-orphan")
    blueprint = relationship("GameBlueprint", back_populates="game", cascade="all, delete-orphan", uselist=False)
    levels = relationship("GameLevel", back_populates="game", cascade="all, delete-orphan")
