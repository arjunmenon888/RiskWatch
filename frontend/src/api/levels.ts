import { API_BASE_URL } from './config';

export type LevelStatus = 'generated' | 'under_review' | 'approved' | 'published';
export type RegenerateSection = 'all' | 'settings' | 'explanation' | 'scenarios' | 'questions' | 'reward' | 'branching';

export type GameLevel = {
  id: number;
  game_id: number;
  topic_id: number;
  creator_id: number;
  sequence_number: number;
  title: string;
  learning_objective: string;
  topic_explanation: string;
  difficulty: string;
  scenarios: Array<Record<string, unknown>>;
  questions: Array<Record<string, unknown>>;
  reward: Record<string, unknown>;
  pass_score: number;
  branching_suggestion: Record<string, unknown>;
  source_chunk_ids: number[];
  status: LevelStatus;
  locked_from_ai_changes: boolean;
  generation_context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LevelUpdate = Partial<
  Pick<
    GameLevel,
    | 'title'
    | 'learning_objective'
    | 'topic_explanation'
    | 'difficulty'
    | 'scenarios'
    | 'questions'
    | 'reward'
    | 'pass_score'
    | 'branching_suggestion'
    | 'source_chunk_ids'
    | 'status'
  >
>;

export async function generateNextLevel(token: string, gameId: number): Promise<GameLevel> {
  return request<GameLevel>('/api/ai/generate-next-level', {
    method: 'POST',
    token,
    body: JSON.stringify({ game_id: gameId }),
  });
}

export async function listLevels(token: string, gameId: number): Promise<GameLevel[]> {
  return request<GameLevel[]>(`/api/games/${gameId}/levels`, { token });
}

export async function createLevel(token: string, gameId: number, insertAt: number): Promise<GameLevel> {
  return request<GameLevel>(`/api/games/${gameId}/levels`, {
    method: 'POST',
    token,
    body: JSON.stringify({ insert_at: insertAt, title: `New Level ${insertAt}` }),
  });
}

export async function reorderLevels(token: string, gameId: number, levelIds: number[]): Promise<GameLevel[]> {
  return request<GameLevel[]>(`/api/games/${gameId}/levels/reorder`, {
    method: 'POST',
    token,
    body: JSON.stringify({ level_ids: levelIds }),
  });
}

export async function approveLevel(token: string, gameId: number, levelId: number): Promise<GameLevel> {
  return request<GameLevel>(`/api/games/${gameId}/levels/${levelId}/approve`, {
    method: 'POST',
    token,
  });
}

export async function updateLevel(token: string, gameId: number, levelId: number, payload: LevelUpdate): Promise<GameLevel> {
  return request<GameLevel>(`/api/games/${gameId}/levels/${levelId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function cloneLevel(token: string, gameId: number, levelId: number): Promise<GameLevel> {
  return request<GameLevel>(`/api/games/${gameId}/levels/${levelId}/clone`, {
    method: 'POST',
    token,
  });
}

export async function deleteLevel(token: string, gameId: number, levelId: number): Promise<void> {
  await request<void>(`/api/games/${gameId}/levels/${levelId}`, {
    method: 'DELETE',
    token,
  });
}

export async function lockLevel(token: string, gameId: number, levelId: number, locked: boolean): Promise<GameLevel> {
  return request<GameLevel>(`/api/games/${gameId}/levels/${levelId}/lock`, {
    method: 'POST',
    token,
    body: JSON.stringify({ locked }),
  });
}

export async function regenerateLevel(token: string, gameId: number, levelId: number, section: RegenerateSection): Promise<GameLevel> {
  return request<GameLevel>(`/api/games/${gameId}/levels/${levelId}/regenerate`, {
    method: 'POST',
    token,
    body: JSON.stringify({ section }),
  });
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
