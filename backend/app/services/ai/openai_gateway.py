from __future__ import annotations

import logging
from typing import TypeVar

from pydantic import BaseModel

from app.core.config import settings

SchemaT = TypeVar("SchemaT", bound=BaseModel)

logger = logging.getLogger(__name__)


def generate_structured(
    schema: type[SchemaT],
    *,
    instructions: str,
    input_text: str,
) -> SchemaT | None:
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.openai_api_key,
            timeout=settings.openai_timeout_seconds,
        )
        response = client.responses.parse(
            model=settings.openai_model,
            reasoning={"effort": settings.openai_reasoning_effort},
            instructions=instructions,
            input=input_text,
            text_format=schema,
        )
        if response.output_parsed is None:
            raise RuntimeError("OpenAI returned no structured output.")
        return response.output_parsed
    except Exception:
        if not settings.openai_allow_local_fallback:
            raise
        logger.exception("OpenAI generation failed; using the local fallback generator.")
        return None


def sampled_chunk_context(chunks: list, *, max_chars: int = 50_000) -> str:
    if not chunks:
        return ""
    per_chunk_limit = 1_800
    estimated_count = max(1, max_chars // per_chunk_limit)
    if len(chunks) <= estimated_count:
        sampled = chunks
    elif estimated_count == 1:
        sampled = [chunks[0]]
    else:
        indexes = {
            round(index * (len(chunks) - 1) / (estimated_count - 1))
            for index in range(estimated_count)
        }
        sampled = [chunks[index] for index in sorted(indexes)]
    sections = []
    current_length = 0
    for chunk in sampled:
        text = " ".join(chunk.text.split())[:per_chunk_limit]
        section = f"[chunk_id={chunk.id}; source={chunk.source_label}]\n{text}"
        if current_length + len(section) > max_chars:
            break
        sections.append(section)
        current_length += len(section)
    return "\n\n".join(sections)
