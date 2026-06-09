from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlayerCertificate(Base):
    __tablename__ = "player_certificates"
    __table_args__ = (
        UniqueConstraint("player_id", "publication_id", name="uq_player_certificate_publication"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_number: Mapped[str] = mapped_column(String(48), unique=True, index=True, nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    publication_id: Mapped[int] = mapped_column(
        ForeignKey("published_game_versions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    player_name: Mapped[str] = mapped_column(String(255), nullable=False)
    game_title: Mapped[str] = mapped_column(String(180), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
