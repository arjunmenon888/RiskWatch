from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass

from app.models.document import DocumentChunk

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


def extract_topics_from_chunks(chunks: list[DocumentChunk], max_topics: int = 8) -> list[ExtractedTopic]:
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
