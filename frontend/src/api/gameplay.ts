import { API_BASE_URL } from './config';
import { Certificate } from './certificates';
import { BranchResolution, EarnedReward } from './rewards';

export type PlayableGame = {
  id: number;
  title: string;
  description: string;
  category: string;
  creator_id: number;
  level_count: number;
  status: string;
};

export type PlayerProgress = {
  id: number;
  player_id: number;
  game_id: number;
  current_level_id: number | null;
  status: string;
  completed_level_ids: number[];
  last_score: number | null;
  created_at: string;
  updated_at: string;
};

export type PlayableQuestion = {
  id: string;
  prompt: string;
  options: Array<Record<string, unknown>>;
  xp: number;
};

export type PlayableLevel = {
  id: number;
  game_id: number;
  sequence_number: number;
  title: string;
  learning_objective: string;
  topic_explanation: string;
  difficulty: string;
  scenarios: Array<Record<string, unknown>>;
  questions: PlayableQuestion[];
  reward: Record<string, unknown>;
  pass_score: number;
  branching_suggestion: Record<string, unknown>;
};

export type GameplaySession = {
  progress: PlayerProgress;
  level: PlayableLevel;
};

export type LevelAttempt = {
  id: number;
  player_id: number;
  game_id: number;
  level_id: number;
  status: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
};

export type StartAttempt = {
  attempt: LevelAttempt;
  level: PlayableLevel;
};

export type AnswerFeedback = {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  feedback: Record<string, unknown>;
};

export type CompleteAttempt = {
  attempt: LevelAttempt;
  score: number;
  passed: boolean;
  reward: EarnedReward | null;
  branch: BranchResolution;
  progress: PlayerProgress;
  certificate: Certificate | null;
};

export async function listPlayableGames(token: string): Promise<PlayableGame[]> {
  return request<PlayableGame[]>('/api/player/games', { token });
}

export async function startGame(token: string, gameId: number): Promise<GameplaySession> {
  return request<GameplaySession>(`/api/player/games/${gameId}/start`, { method: 'POST', token });
}

export async function getGameProgress(token: string, gameId: number): Promise<GameplaySession> {
  return request<GameplaySession>(`/api/player/games/${gameId}/progress`, { token });
}

export async function startLevelAttempt(token: string, levelId: number): Promise<StartAttempt> {
  return request<StartAttempt>(`/api/player/levels/${levelId}/attempts`, { method: 'POST', token });
}

export async function submitAnswer(
  token: string,
  attemptId: number,
  questionId: string,
  selectedAnswer: string,
): Promise<AnswerFeedback> {
  return request<AnswerFeedback>(`/api/player/attempts/${attemptId}/answers`, {
    method: 'POST',
    token,
    body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer }),
  });
}

export async function completeAttempt(token: string, attemptId: number): Promise<CompleteAttempt> {
  return request<CompleteAttempt>(`/api/player/attempts/${attemptId}/complete`, { method: 'POST', token });
}

async function request<T>(path: string, options: RequestInit & { token: string }): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = 'Something went wrong.';
    try {
      const payload = await response.json();
      message = payload.detail ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
