from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_creator
from app.db.session import get_db
from app.models.game import Game
from app.models.user import User
from app.schemas.game import GameCreate, GameRead, GameUpdate

router = APIRouter(prefix="/creator/games", tags=["creator-games"])


@router.post("", response_model=GameRead, status_code=status.HTTP_201_CREATED)
def create_game(
    payload: GameCreate,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> Game:
    game = Game(
        creator_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        visibility=payload.visibility,
        creation_mode=payload.creation_mode,
        status="draft",
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.get("", response_model=list[GameRead])
def list_games(
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Game]:
    return list(
        db.scalars(
            select(Game)
            .where(Game.creator_id == current_user.id)
            .order_by(Game.updated_at.desc(), Game.id.desc())
        )
    )


@router.get("/{game_id}", response_model=GameRead)
def get_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> Game:
    return _get_owned_game(game_id, current_user, db)


@router.patch("/{game_id}", response_model=GameRead)
def update_game(
    game_id: int,
    payload: GameUpdate,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> Game:
    game = _get_owned_game(game_id, current_user, db)
    update_values = payload.model_dump(exclude_unset=True)
    for field, value in update_values.items():
        setattr(game, field, value)

    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(
    game_id: int,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    game = _get_owned_game(game_id, current_user, db)
    db.delete(game)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_owned_game(game_id: int, current_user: User, db: Session) -> Game:
    game = db.get(Game, game_id)
    if game is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    if game.creator_id != current_user.id and not current_user.role_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game
