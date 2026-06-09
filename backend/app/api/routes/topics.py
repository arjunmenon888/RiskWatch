from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.document import Document, DocumentChunk
from app.models.game import Game
from app.models.topic import Topic
from app.models.user import User
from app.schemas.topic import ExtractTopicsRequest, TopicRead, TopicReorderRequest, TopicUpdate
from app.services.ai.topic_extraction import extract_topics_from_chunks

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])
topics_router = APIRouter(prefix="/api/games/{game_id}/topics", tags=["topics"])


@ai_router.post("/extract-topics", response_model=list[TopicRead], status_code=status.HTTP_201_CREATED)
def extract_topics(
    payload: ExtractTopicsRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Topic]:
    game = _get_owned_game(payload.game_id, current_user, db)
    document_filter = [Document.game_id == game.id, Document.status == "processed"]
    if payload.document_id is not None:
        document_filter.append(Document.id == payload.document_id)

    documents = list(db.scalars(select(Document).where(*document_filter).order_by(Document.updated_at.desc())))
    if not documents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No processed documents are available for topic extraction.")

    document_ids = [document.id for document in documents]
    chunks = list(
        db.scalars(
            select(DocumentChunk)
            .where(DocumentChunk.document_id.in_(document_ids))
            .order_by(DocumentChunk.document_id.asc(), DocumentChunk.chunk_index.asc())
        )
    )
    if not chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No document chunks are available for topic extraction.")

    if payload.replace_existing:
        delete_filter = [Topic.game_id == game.id]
        if payload.document_id is not None:
            delete_filter.append(Topic.document_id == payload.document_id)
        db.execute(delete(Topic).where(*delete_filter))
        db.commit()

    extracted_topics = extract_topics_from_chunks(chunks)
    if not extracted_topics:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI could not identify topics from the document chunks.")

    existing_count = len(list(db.scalars(select(Topic.id).where(Topic.game_id == game.id))))
    topics: list[Topic] = []
    for index, extracted in enumerate(extracted_topics):
        document_id = _document_id_for_chunks(extracted.source_chunk_ids, chunks)
        topic = Topic(
            game_id=game.id,
            document_id=document_id,
            title=extracted.title,
            summary=extracted.summary,
            source_chunk_ids=extracted.source_chunk_ids,
            difficulty=extracted.difficulty,
            recommended_level_count=extracted.recommended_level_count,
            selected=True,
            sort_order=existing_count + index,
        )
        db.add(topic)
        topics.append(topic)

    db.commit()
    for topic in topics:
        db.refresh(topic)
    return topics


@topics_router.get("", response_model=list[TopicRead])
def list_topics(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Topic]:
    _get_owned_game(game_id, current_user, db)
    return list(db.scalars(select(Topic).where(Topic.game_id == game_id).order_by(Topic.sort_order.asc(), Topic.id.asc())))


@topics_router.patch("/{topic_id}", response_model=TopicRead)
def update_topic(
    game_id: int,
    topic_id: int,
    payload: TopicUpdate,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Topic:
    topic = _get_owned_topic(game_id, topic_id, current_user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@topics_router.post("/reorder", response_model=list[TopicRead])
def reorder_topics(
    game_id: int,
    payload: TopicReorderRequest,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Topic]:
    _get_owned_game(game_id, current_user, db)
    topics = list(db.scalars(select(Topic).where(Topic.game_id == game_id, Topic.id.in_(payload.topic_ids))))
    if len(topics) != len(set(payload.topic_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more topics do not belong to this game.")
    topic_by_id = {topic.id: topic for topic in topics}
    for index, topic_id in enumerate(payload.topic_ids):
        topic_by_id[topic_id].sort_order = index
        db.add(topic_by_id[topic_id])
    db.commit()
    return list_topics(game_id, current_user, db)


@topics_router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    game_id: int,
    topic_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    topic = _get_owned_topic(game_id, topic_id, current_user, db)
    db.delete(topic)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_owned_game(game_id: int, current_user: User, db: Session) -> Game:
    game = db.get(Game, game_id)
    if game is None or game.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game


def _get_owned_topic(game_id: int, topic_id: int, current_user: User, db: Session) -> Topic:
    _get_owned_game(game_id, current_user, db)
    topic = db.get(Topic, topic_id)
    if topic is None or topic.game_id != game_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")
    return topic


def _document_id_for_chunks(source_chunk_ids: list[int], chunks: list[DocumentChunk]) -> int | None:
    chunk_by_id = {chunk.id: chunk for chunk in chunks}
    for chunk_id in source_chunk_ids:
        chunk = chunk_by_id.get(chunk_id)
        if chunk is not None:
            return chunk.document_id
    return None
