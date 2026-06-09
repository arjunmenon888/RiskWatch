from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DocumentStatus = Literal["uploaded", "processing", "processed", "failed"]


class TextDocumentCreate(BaseModel):
    title: str = Field(default="Pasted learning content", min_length=1, max_length=180)
    content: str = Field(min_length=20, max_length=100_000)


class DocumentChunkRead(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    text: str
    source_label: str

    model_config = {"from_attributes": True}


class DocumentRead(BaseModel):
    id: int
    game_id: int
    creator_id: int
    filename: str
    content_type: str
    file_extension: str
    status: DocumentStatus
    error_message: str | None
    extracted_text_char_count: int
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetail(DocumentRead):
    chunks: list[DocumentChunkRead]
