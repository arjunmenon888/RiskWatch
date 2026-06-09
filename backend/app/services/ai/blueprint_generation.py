from __future__ import annotations

import json
from dataclasses import dataclass

from pydantic import BaseModel, Field

from app.models.game import Game
from app.models.topic import Topic
from app.services.ai.openai_gateway import generate_structured


@dataclass(frozen=True)
class GeneratedBlueprint:
    title: str
    description: str
    total_levels: int
    estimated_duration_minutes: int
    topic_order: list[int]
    difficulty_distribution: dict[str, int]
    reward_style: str
    branching_style: str


class OpenAIBlueprint(BaseModel):
    title: str
    description: str
    estimated_duration_minutes: int = Field(ge=5, le=600)
    topic_order: list[int]
    reward_style: str
    branching_style: str


def create_blueprint_from_topics(game: Game, topics: list[Topic]) -> GeneratedBlueprint:
    selected_topics = [topic for topic in topics if topic.selected]
    if not selected_topics:
        selected_topics = topics

    openai_blueprint = _create_blueprint_with_openai(game, selected_topics)
    if openai_blueprint is not None:
        return openai_blueprint
    return _create_blueprint_locally(game, selected_topics)


def _create_blueprint_with_openai(
    game: Game,
    selected_topics: list[Topic],
) -> GeneratedBlueprint | None:
    if not selected_topics:
        return None
    topic_payload = [
        {
            "id": topic.id,
            "title": topic.title,
            "summary": topic.summary,
            "difficulty": topic.difficulty,
            "recommended_level_count": topic.recommended_level_count,
        }
        for topic in selected_topics
    ]
    result = generate_structured(
        OpenAIBlueprint,
        instructions=(
            "You are designing the progression for an educational game. Produce an engaging but "
            "professional blueprint grounded only in the supplied game and topics. Order topics "
            "pedagogically from foundations to application. Use only the supplied numeric topic IDs. "
            "Describe rewards and branching behavior succinctly; do not add unrelated subject matter."
        ),
        input_text=json.dumps(
            {
                "game": {
                    "title": game.title,
                    "description": game.description,
                    "category": game.category,
                },
                "topics": topic_payload,
            },
            ensure_ascii=True,
        ),
    )
    if result is None:
        return None

    valid_ids = {topic.id for topic in selected_topics}
    ordered_ids = [
        topic_id
        for topic_id in dict.fromkeys(result.topic_order)
        if topic_id in valid_ids
    ]
    ordered_ids.extend(topic.id for topic in selected_topics if topic.id not in ordered_ids)
    total_levels, distribution = _level_plan(selected_topics)
    return GeneratedBlueprint(
        title=" ".join(result.title.split())[:180] or game.title or "Learning Quest",
        description=" ".join(result.description.split())[:1000],
        total_levels=total_levels,
        estimated_duration_minutes=result.estimated_duration_minutes,
        topic_order=ordered_ids,
        difficulty_distribution=distribution,
        reward_style=" ".join(result.reward_style.split())[:250],
        branching_style=" ".join(result.branching_style.split())[:250],
    )


def _create_blueprint_locally(game: Game, selected_topics: list[Topic]) -> GeneratedBlueprint:
    total_levels, distribution = _level_plan(selected_topics)
    duration = max(8, total_levels * 5)
    topic_names = ", ".join(topic.title for topic in selected_topics[:4])

    strongest = _strongest_difficulty(distribution)
    title = game.title if game.title else "Learning Quest"
    if not title.lower().endswith(("quest", "challenge", "journey")):
        title = f"{title} Quest"

    return GeneratedBlueprint(
        title=title,
        description=(
            f"A {strongest} learning game that guides players through {topic_names}. "
            "Players review explanations, make scenario decisions, earn rewards, and revisit weak areas."
        ),
        total_levels=total_levels,
        estimated_duration_minutes=duration,
        topic_order=[topic.id for topic in selected_topics],
        difficulty_distribution=distribution,
        reward_style="XP + badges + streak bonus",
        branching_style="pass/fail with review paths and retry branches",
    )


def _level_plan(topics: list[Topic]) -> tuple[int, dict[str, int]]:
    distribution = {"beginner": 0, "intermediate": 0, "advanced": 0}
    for topic in topics:
        distribution[topic.difficulty] = (
            distribution.get(topic.difficulty, 0) + topic.recommended_level_count
        )
    return max(1, sum(distribution.values())), distribution


def _strongest_difficulty(distribution: dict[str, int]) -> str:
    if distribution.get("advanced", 0):
        return "advanced"
    if distribution.get("intermediate", 0):
        return "intermediate"
    return "beginner"
