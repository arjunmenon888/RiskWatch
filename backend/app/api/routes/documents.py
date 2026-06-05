from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_creator
from app.db.session import get_db
from app.models.document import Document, DocumentChunk
from app.models.game import Game
from app.models.user import User
from app.schemas.document import DocumentDetail, DocumentRead
from app.services.documents.extraction import chunk_sections, extract_sections, validate_office_file
from app.services.documents.storage import store_upload

router = APIRouter(prefix="/api/games/{game_id}/documents", tags=["documents"])

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx"}


@router.post("/upload", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
async def upload_document(
    game_id: int,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> Document:
    game = _get_owned_game(game_id, current_user, db)
    extension = Path(file.filename or "").suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF, DOCX, and PPTX files are supported.")

    stored_path = await store_upload(game.id, file, extension)
    document = Document(
        game_id=game.id,
        creator_id=current_user.id,
        filename=file.filename or stored_path.name,
        content_type=file.content_type or "application/octet-stream",
        file_extension=extension,
        storage_path=str(stored_path),
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    _process_document(document, stored_path, db)
    db.refresh(document)
    return document


@router.get("", response_model=list[DocumentRead])
def list_documents(
    game_id: int,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Document]:
    game = _get_owned_game(game_id, current_user, db)
    return list(
        db.scalars(
            select(Document)
            .where(Document.game_id == game.id, Document.creator_id == current_user.id)
            .order_by(Document.updated_at.desc(), Document.id.desc())
        )
    )


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    game_id: int,
    document_id: int,
    current_user: Annotated[User, Depends(require_creator)],
    db: Annotated[Session, Depends(get_db)],
) -> Document:
    _get_owned_game(game_id, current_user, db)
    document = db.get(Document, document_id)
    if document is None or document.game_id != game_id or document.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


def _process_document(document: Document, stored_path: Path, db: Session) -> None:
    document.status = "processing"
    db.add(document)
    db.commit()
    try:
        if document.file_extension in {".docx", ".pptx"}:
            validate_office_file(stored_path)
        sections = extract_sections(stored_path, document.file_extension)
        chunks = chunk_sections(sections)
        if not chunks:
            raise ValueError("No extractable text was found in the document.")

        for index, chunk in enumerate(chunks):
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=index,
                    text=chunk.text,
                    source_label=chunk.label,
                )
            )
        document.status = "processed"
        document.error_message = None
        document.extracted_text_char_count = sum(len(chunk.text) for chunk in chunks)
        document.chunk_count = len(chunks)
    except Exception as error:
        document.status = "failed"
        document.error_message = str(error)
        document.extracted_text_char_count = 0
        document.chunk_count = 0
    finally:
        db.add(document)
        db.commit()


def _get_owned_game(game_id: int, current_user: User, db: Session) -> Game:
    game = db.get(Game, game_id)
    if game is None or (game.creator_id != current_user.id and not current_user.role_admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game
