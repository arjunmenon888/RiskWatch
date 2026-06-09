from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.blueprint import GameBlueprint
from app.models.game import Game
from app.models.topic import Topic
from app.models.user import User
from app.schemas.blueprint import BlueprintRead, BlueprintUpdate, CreateBlueprintRequest
from app.services.ai.blueprint_generation import create_blueprint_from_topics

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])
blueprints_router = APIRouter(prefix="/api/games/{game_id}/blueprint", tags=["blueprints"])


@ai_router.post("/create-blueprint", response_model=BlueprintRead, status_code=status.HTTP_201_CREATED)
def create_blueprint(
    payload: CreateBlueprintRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameBlueprint:
    game = _get_owned_game(payload.game_id, current_user, db)
    topics = list(
        db.scalars(
            select(Topic)
            .where(Topic.game_id == game.id)
            .order_by(Topic.sort_order.asc(), Topic.id.asc())
        )
    )
    if not topics:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select or extract topics before creating a blueprint.")

    existing = db.scalar(select(GameBlueprint).where(GameBlueprint.game_id == game.id))
    if existing is not None and not payload.replace_existing:
        return existing
    if existing is not None:
        db.delete(existing)
        db.commit()

    generated = create_blueprint_from_topics(game, topics)
    blueprint = GameBlueprint(
        game_id=game.id,
        creator_id=current_user.id,
        title=generated.title,
        description=generated.description,
        total_levels=generated.total_levels,
        estimated_duration_minutes=generated.estimated_duration_minutes,
        topic_order=generated.topic_order,
        difficulty_distribution=generated.difficulty_distribution,
        reward_style=generated.reward_style,
        branching_style=generated.branching_style,
        approved=False,
    )
    db.add(blueprint)
    db.commit()
    db.refresh(blueprint)
    return blueprint


@blueprints_router.get("", response_model=BlueprintRead)
def get_blueprint(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameBlueprint:
    return _get_owned_blueprint(game_id, current_user, db)


@blueprints_router.patch("", response_model=BlueprintRead)
def update_blueprint(
    game_id: int,
    payload: BlueprintUpdate,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameBlueprint:
    blueprint = _get_owned_blueprint(game_id, current_user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(blueprint, field, value)
    blueprint.approved = False
    db.add(blueprint)
    db.commit()
    db.refresh(blueprint)
    return blueprint


@blueprints_router.post("/approve", response_model=BlueprintRead)
def approve_blueprint(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameBlueprint:
    blueprint = _get_owned_blueprint(game_id, current_user, db)
    blueprint.approved = True
    db.add(blueprint)
    db.commit()
    db.refresh(blueprint)
    return blueprint


def _get_owned_game(game_id: int, current_user: User, db: Session) -> Game:
    game = db.get(Game, game_id)
    if game is None or game.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game


def _get_owned_blueprint(game_id: int, current_user: User, db: Session) -> GameBlueprint:
    _get_owned_game(game_id, current_user, db)
    blueprint = db.scalar(select(GameBlueprint).where(GameBlueprint.game_id == game_id))
    if blueprint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blueprint not found.")
    return blueprint
