from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import require_user
from app.models.user import User

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("/creator")
def creator_dashboard(current_user: Annotated[User, Depends(require_user)]) -> dict[str, str]:
    return {"status": "ok", "mode": "creator", "user": current_user.email}


@router.get("/player")
def player_dashboard(current_user: Annotated[User, Depends(require_user)]) -> dict[str, str]:
    return {"status": "ok", "mode": "player", "user": current_user.email}
