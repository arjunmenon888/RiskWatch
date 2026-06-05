from __future__ import annotations

from dataclasses import dataclass

from app.models.game import Game
from app.models.topic import Topic


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


def create_blueprint_from_topics(game: Game, topics: list[Topic]) -> GeneratedBlueprint:
    selected_topics = [topic for topic in topics if topic.selected]
    if not selected_topics:
        selected_topics = topics

    total_levels = max(1, sum(topic.recommended_level_count for topic in selected_topics))
    duration = max(8, total_levels * 5)
    topic_names = ", ".join(topic.title for topic in selected_topics[:4])
    distribution = {"beginner": 0, "intermediate": 0, "advanced": 0}
    for topic in selected_topics:
        distribution[topic.difficulty] = distribution.get(topic.difficulty, 0) + topic.recommended_level_count

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


def _strongest_difficulty(distribution: dict[str, int]) -> str:
    if distribution.get("advanced", 0):
        return "advanced"
    if distribution.get("intermediate", 0):
        return "intermediate"
    return "beginner"
