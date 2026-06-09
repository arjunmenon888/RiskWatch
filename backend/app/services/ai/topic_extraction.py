from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

from app.models.document import DocumentChunk
from app.services.ai.openai_gateway import generate_structured, sampled_chunk_context

STOPWORDS = {
    "about",
    "after",
    "also",
    "and",
    "are",
    "before",
    "between",
    "can",
    "for",
    "from",
    "have",
    "into",
    "learn",
    "learning",
    "must",
    "should",
    "that",
    "the",
    "their",
    "this",
    "through",
    "with",
    "your",
}


@dataclass(frozen=True)
class ExtractedTopic:
    title: str
    summary: str
    source_chunk_ids: list[int]
    difficulty: str
    recommended_level_count: int


class OpenAITopic(BaseModel):
    title: str
    summary: str
    source_chunk_ids: list[int]
    difficulty: Literal["beginner", "intermediate", "advanced"]
    recommended_level_count: int = Field(ge=1, le=12)


class OpenAITopicList(BaseModel):
    topics: list[OpenAITopic]


def extract_topics_from_chunks(chunks: list[DocumentChunk], max_topics: int = 8) -> list[ExtractedTopic]:
    openai_topics = _extract_topics_with_openai(chunks, max_topics)
    if openai_topics:
        return openai_topics
    return _extract_topics_locally(chunks, max_topics)


def _extract_topics_with_openai(
    chunks: list[DocumentChunk],
    max_topics: int,
) -> list[ExtractedTopic]:
    if not chunks:
        return []
    context = sampled_chunk_context(chunks)
    result = generate_structured(
        OpenAITopicList,
        instructions=(
            "You are an instructional game designer. Identify distinct, useful learning topics "
            "from the supplied source chunks. Ground every topic in the source, do not invent facts, "
            "and only cite chunk IDs that appear in the input. Titles should be concise, summaries "
            "should explain what the player must learn, and recommended level counts should reflect "
            "the amount and complexity of source material."
        ),
        input_text=(
            f"Create at most {max_topics} topics. Return them in a logical learning order.\n\n"
            f"SOURCE CHUNKS\n{context}"
        ),
    )
    if result is None:
        return []

    valid_chunk_ids = {chunk.id for chunk in chunks}
    fallback_chunk_id = chunks[0].id
    topics: list[ExtractedTopic] = []
    seen_titles: set[str] = set()
    for item in result.topics[:max_topics]:
        title = " ".join(item.title.split())[:180]
        normalized_title = title.lower()
        if not title or normalized_title in seen_titles:
            continue
        source_ids = [
            chunk_id
            for chunk_id in dict.fromkeys(item.source_chunk_ids)
            if chunk_id in valid_chunk_ids
        ]
        topics.append(
            ExtractedTopic(
                title=title,
                summary=" ".join(item.summary.split())[:500],
                source_chunk_ids=source_ids or [fallback_chunk_id],
                difficulty=item.difficulty,
                recommended_level_count=item.recommended_level_count,
            )
        )
        seen_titles.add(normalized_title)
    return topics


def _extract_topics_locally(chunks: list[DocumentChunk], max_topics: int) -> list[ExtractedTopic]:
    candidates: list[ExtractedTopic] = []
    for chunk in chunks:
        title = _title_from_text(chunk.text)
        if not title:
            continue
        candidates.append(
            ExtractedTopic(
                title=title,
                summary=_summary_from_text(chunk.text),
                source_chunk_ids=[chunk.id],
                difficulty=_estimate_difficulty(chunk.text),
                recommended_level_count=_estimate_level_count(chunk.text),
            )
        )

    merged: dict[str, ExtractedTopic] = {}
    for topic in candidates:
        key = topic.title.lower()
        if key not in merged:
            merged[key] = topic
            continue
        existing = merged[key]
        merged[key] = ExtractedTopic(
            title=existing.title,
            summary=existing.summary,
            source_chunk_ids=sorted(set(existing.source_chunk_ids + topic.source_chunk_ids)),
            difficulty=_max_difficulty(existing.difficulty, topic.difficulty),
            recommended_level_count=max(existing.recommended_level_count, topic.recommended_level_count),
        )

    return list(merged.values())[:max_topics]


def _title_from_text(text: str) -> str:
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]{2,}", text.lower())
    keywords = [word for word in words if word not in STOPWORDS]
    if not keywords:
        return ""
    common = [word for word, _count in Counter(keywords).most_common(4)]
    return " ".join(word.capitalize() for word in common)


def _summary_from_text(text: str) -> str:
    clean = " ".join(text.split())
    sentences = re.split(r"(?<=[.!?])\s+", clean)
    summary = sentences[0] if sentences and sentences[0] else clean[:220]
    return summary[:260]


def _estimate_difficulty(text: str) -> str:
    word_count = len(text.split())
    unique_word_count = len(set(re.findall(r"[A-Za-z][A-Za-z0-9-]{2,}", text.lower())))
    if word_count > 180 or unique_word_count > 85:
        return "advanced"
    if word_count > 80 or unique_word_count > 35:
        return "intermediate"
    return "beginner"


def _estimate_level_count(text: str) -> int:
    word_count = len(text.split())
    if word_count > 240:
        return 3
    if word_count > 100:
        return 2
    return 1


def _max_difficulty(left: str, right: str) -> str:
    order = {"beginner": 0, "intermediate": 1, "advanced": 2}
    return left if order[left] >= order[right] else right
