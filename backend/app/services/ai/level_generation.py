from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

from app.core.config import settings
from app.models.blueprint import GameBlueprint
from app.models.document import DocumentChunk
from app.models.level import GameLevel
from app.models.topic import Topic
from app.services.ai.openai_gateway import generate_structured, sampled_chunk_context


@dataclass(frozen=True)
class GeneratedLevel:
    title: str
    learning_objective: str
    topic_explanation: str
    difficulty: str
    scenarios: list[dict]
    questions: list[dict]
    reward: dict
    pass_score: int
    branching_suggestion: dict
    source_chunk_ids: list[int]
    generation_context: dict


class OpenAIOption(BaseModel):
    id: str
    text: str


class OpenAIFeedback(BaseModel):
    correct: str
    incorrect: str


class OpenAIQuestion(BaseModel):
    id: str
    prompt: str
    options: list[OpenAIOption] = Field(min_length=2, max_length=6)
    correct_answer: str
    xp: int = Field(ge=1, le=1000)
    feedback: OpenAIFeedback


class OpenAIScenario(BaseModel):
    id: str
    title: str
    prompt: str
    success_criteria: str


class OpenAILevel(BaseModel):
    title: str
    learning_objective: str
    topic_explanation: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    scenarios: list[OpenAIScenario] = Field(min_length=1, max_length=6)
    questions: list[OpenAIQuestion] = Field(min_length=2, max_length=12)
    badge_name: str
    pass_score: int = Field(ge=1, le=100)


def generate_level(
    topic: Topic,
    sequence_number: int,
    blueprint: GameBlueprint | None,
    source_chunks: list[DocumentChunk],
    previous_levels: list[GameLevel],
) -> GeneratedLevel:
    openai_level = _generate_level_with_openai(
        topic,
        sequence_number,
        blueprint,
        source_chunks,
        previous_levels,
    )
    if openai_level is not None:
        return openai_level
    return _generate_level_locally(
        topic,
        sequence_number,
        blueprint,
        source_chunks,
        previous_levels,
    )


def _generate_level_with_openai(
    topic: Topic,
    sequence_number: int,
    blueprint: GameBlueprint | None,
    source_chunks: list[DocumentChunk],
    previous_levels: list[GameLevel],
) -> GeneratedLevel | None:
    if not source_chunks:
        return None
    scenario_count, question_count = _counts_for_difficulty(topic.difficulty)
    reward_style = blueprint.reward_style if blueprint else "XP + badges"
    branching_style = blueprint.branching_style if blueprint else "pass/fail with review paths"
    result = generate_structured(
        OpenAILevel,
        instructions=(
            "You create playable educational game levels from source material. Every explanation, "
            "scenario, question, answer, and feedback statement must be supported by the supplied "
            "source chunks. Create plausible distractors without introducing false instructional "
            "claims. Questions must have one unambiguous correct option, option IDs must be unique "
            "within a question, and correct_answer must match an option ID. Assign XP based on "
            "question difficulty and importance. Avoid referring to the source document or chunks "
            "in player-facing text."
        ),
        input_text=(
            json.dumps(
                {
                    "level_number": sequence_number,
                    "requested_scenario_count": scenario_count,
                    "requested_question_count": question_count,
                    "topic": {
                        "title": topic.title,
                        "summary": topic.summary,
                        "difficulty": topic.difficulty,
                    },
                    "game_blueprint": {
                        "title": blueprint.title if blueprint else None,
                        "description": blueprint.description if blueprint else None,
                        "reward_style": reward_style,
                        "branching_style": branching_style,
                    },
                    "previous_level_titles": [level.title for level in previous_levels],
                },
                ensure_ascii=True,
            )
            + "\n\nSOURCE CHUNKS\n"
            + sampled_chunk_context(source_chunks)
        ),
    )
    if result is None:
        return None

    questions = _normalize_openai_questions(result.questions, sequence_number)
    if len(questions) < 2:
        return None
    scenarios = [
        {
            "id": f"scenario-{sequence_number}-{index}",
            "title": " ".join(scenario.title.split())[:180],
            "prompt": " ".join(scenario.prompt.split())[:1200],
            "success_criteria": " ".join(scenario.success_criteria.split())[:500],
        }
        for index, scenario in enumerate(result.scenarios, start=1)
    ]
    total_xp = sum(question["xp"] for question in questions)
    return GeneratedLevel(
        title=" ".join(result.title.split())[:180] or f"Level {sequence_number}: {topic.title}",
        learning_objective=" ".join(result.learning_objective.split())[:500],
        topic_explanation=" ".join(result.topic_explanation.split())[:4000],
        difficulty=result.difficulty,
        scenarios=scenarios,
        questions=questions,
        reward={
            "xp": total_xp,
            "badge": " ".join(result.badge_name.split())[:180] or f"{topic.title} Explorer",
            "style": reward_style,
            "completion_trigger": "earned automatically when the player passes this level",
        },
        pass_score=result.pass_score,
        branching_suggestion={
            "style": branching_style,
            "success_path": "Continue to the next approved topic.",
            "review_path": "Replay the explanation and retry one focused challenge.",
            "branches": _default_branches(sequence_number),
        },
        source_chunk_ids=[chunk.id for chunk in source_chunks],
        generation_context={
            "provider": "openai",
            "model": settings.openai_model,
            "topic_id": topic.id,
            "previous_level_ids": [level.id for level in previous_levels],
            "reward_pattern": reward_style,
            "branching_pattern": branching_style,
            "source_chunk_count": len(source_chunks),
        },
    )


def _normalize_openai_questions(
    questions: list[OpenAIQuestion],
    sequence_number: int,
) -> list[dict]:
    normalized = []
    for question_index, question in enumerate(questions, start=1):
        option_ids: set[str] = set()
        options = []
        original_to_normalized: dict[str, str] = {}
        for option_index, option in enumerate(question.options):
            option_id = chr(ord("A") + option_index)
            original_id = option.id.strip()
            if original_id in option_ids:
                continue
            option_ids.add(original_id)
            original_to_normalized[original_id] = option_id
            options.append(
                {
                    "id": option_id,
                    "text": " ".join(option.text.split())[:600],
                }
            )
        correct_answer = original_to_normalized.get(question.correct_answer.strip())
        if len(options) < 2 or correct_answer is None:
            continue
        normalized.append(
            {
                "id": f"question-{sequence_number}-{question_index}",
                "prompt": " ".join(question.prompt.split())[:1000],
                "options": options,
                "correct_answer": correct_answer,
                "xp": question.xp,
                "feedback": {
                    "correct": " ".join(question.feedback.correct.split())[:800],
                    "incorrect": " ".join(question.feedback.incorrect.split())[:800],
                },
            }
        )
    return normalized


def _generate_level_locally(
    topic: Topic,
    sequence_number: int,
    blueprint: GameBlueprint | None,
    source_chunks: list[DocumentChunk],
    previous_levels: list[GameLevel],
) -> GeneratedLevel:
    scenario_count, question_count = _counts_for_difficulty(topic.difficulty)
    source_text = " ".join(chunk.text for chunk in source_chunks).strip()
    explanation = _build_explanation(topic, source_text)
    tone = "clear, scenario-led, and practical"
    reward_style = blueprint.reward_style if blueprint else "XP + badges"
    branching_style = blueprint.branching_style if blueprint else "pass/fail with review paths"

    scenarios = [
        {
            "id": f"scenario-{sequence_number}-{index + 1}",
            "title": f"{topic.title} Decision {index + 1}",
            "prompt": (
                f"You are applying {topic.title.lower()} in a realistic workplace situation. "
                "Choose the safest next action before moving forward."
            ),
            "success_criteria": "Player identifies the safest action and explains the reason.",
        }
        for index in range(scenario_count)
    ]

    questions = [
        {
            "id": f"question-{sequence_number}-{index + 1}",
            "prompt": _question_prompt(topic, index),
            "options": [
                {"id": "A", "text": f"Apply the safest {topic.title.lower()} practice first."},
                {"id": "B", "text": "Ignore the warning signs and continue the task."},
                {"id": "C", "text": "Wait until the end of the shift to report concerns."},
                {"id": "D", "text": "Ask an untrained teammate to decide alone."},
            ],
            "correct_answer": "A",
            "xp": _question_xp_for_difficulty(topic.difficulty),
            "feedback": {
                "correct": f"Correct. {topic.title} depends on early, deliberate action.",
                "incorrect": f"Review the explanation and look for the action that best supports {topic.title.lower()}.",
            },
        }
        for index in range(question_count)
    ]

    return GeneratedLevel(
        title=f"Level {sequence_number}: {topic.title}",
        learning_objective=f"Apply {topic.title.lower()} in a realistic decision-making scenario.",
        topic_explanation=explanation,
        difficulty=topic.difficulty,
        scenarios=scenarios,
        questions=questions,
        reward={
            "xp": _reward_xp_for_difficulty(topic.difficulty),
            "badge": f"{topic.title} Explorer",
            "style": reward_style,
            "completion_trigger": "earned when the player passes this level",
        },
        pass_score=_pass_score_for_difficulty(topic.difficulty),
        branching_suggestion={
            "style": branching_style,
            "success_path": "Continue to the next approved topic.",
            "review_path": "Replay the explanation and retry one focused challenge.",
            "branches": _default_branches(sequence_number),
        },
        source_chunk_ids=topic.source_chunk_ids,
        generation_context={
            "topic_id": topic.id,
            "previous_level_ids": [level.id for level in previous_levels],
            "reward_pattern": reward_style,
            "branching_pattern": branching_style,
            "tone": tone,
            "source_chunk_count": len(source_chunks),
        },
    )


def _counts_for_difficulty(difficulty: str) -> tuple[int, int]:
    if difficulty == "advanced":
        return 3, 5
    if difficulty == "intermediate":
        return 2, 4
    return 1, 3


def _pass_score_for_difficulty(difficulty: str) -> int:
    if difficulty == "advanced":
        return 80
    if difficulty == "intermediate":
        return 75
    return 70


def _reward_xp_for_difficulty(difficulty: str) -> int:
    if difficulty == "advanced":
        return 250
    if difficulty == "intermediate":
        return 125
    return 50


def _question_xp_for_difficulty(difficulty: str) -> int:
    total_xp = _reward_xp_for_difficulty(difficulty)
    _scenario_count, question_count = _counts_for_difficulty(difficulty)
    return max(1, total_xp // question_count)


def _default_branches(sequence_number: int) -> list[dict]:
    return [
        {
            "id": f"branch-{sequence_number}-pass",
            "label": "Pass path",
            "condition": "pass",
            "target_type": "next_level",
            "target_level_id": None,
            "min_score": None,
            "max_score": None,
            "description": "Move the player to the next approved level.",
        },
        {
            "id": f"branch-{sequence_number}-fail",
            "label": "Fail path",
            "condition": "fail",
            "target_type": "review_path",
            "target_level_id": None,
            "min_score": None,
            "max_score": None,
            "description": "Send the player through review before retrying.",
        },
        {
            "id": f"branch-{sequence_number}-high-score",
            "label": "Advanced path",
            "condition": "high_score",
            "target_type": "next_level",
            "target_level_id": None,
            "min_score": 90,
            "max_score": None,
            "description": "Let high-scoring players continue quickly.",
        },
        {
            "id": f"branch-{sequence_number}-low-score",
            "label": "Remedial path",
            "condition": "low_score",
            "target_type": "retry_current",
            "target_level_id": None,
            "min_score": None,
            "max_score": 69,
            "description": "Ask low-scoring players to retry this level.",
        },
    ]


def _build_explanation(topic: Topic, source_text: str) -> str:
    if source_text:
        base = source_text[:520]
        return f"{topic.summary} Source-grounded notes: {base}"
    return topic.summary


def _question_prompt(topic: Topic, index: int) -> str:
    prompts = [
        f"What is the safest first step when working with {topic.title.lower()}?",
        f"Which action best shows understanding of {topic.title.lower()}?",
        f"What should a player do after spotting a risk related to {topic.title.lower()}?",
        f"Which response keeps the scenario aligned with {topic.title.lower()}?",
        f"What evidence shows the player is ready to continue from {topic.title.lower()}?",
    ]
    return prompts[index % len(prompts)]
