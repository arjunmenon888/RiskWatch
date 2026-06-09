from uuid import uuid4

from sqlalchemy import select

from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.user import User


def create_test_user_headers(email: str, name: str) -> dict[str, str]:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                email=email,
                name=name,
                provider="test",
                google_sub=f"test-{uuid4().hex}",
                email_verified=True,
                role="creator_player",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}
