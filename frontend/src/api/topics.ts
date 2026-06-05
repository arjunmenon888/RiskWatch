import { API_BASE_URL } from './config';

export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type Topic = {
  id: number;
  game_id: number;
  document_id: number | null;
  title: string;
  summary: string;
  source_chunk_ids: number[];
  difficulty: TopicDifficulty;
  recommended_level_count: number;
  selected: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TopicUpdate = Partial<Pick<Topic, 'title' | 'summary' | 'difficulty' | 'recommended_level_count' | 'selected' | 'sort_order'>>;

export async function extractTopics(token: string, gameId: number, documentId?: number): Promise<Topic[]> {
  return request<Topic[]>('/api/ai/extract-topics', {
    method: 'POST',
    token,
    body: JSON.stringify({
      game_id: gameId,
      document_id: documentId ?? null,
      replace_existing: true,
    }),
  });
}

export async function listTopics(token: string, gameId: number): Promise<Topic[]> {
  return request<Topic[]>(`/api/games/${gameId}/topics`, { token });
}

export async function updateTopic(token: string, gameId: number, topicId: number, payload: TopicUpdate): Promise<Topic> {
  return request<Topic>(`/api/games/${gameId}/topics/${topicId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function reorderTopics(token: string, gameId: number, topicIds: number[]): Promise<Topic[]> {
  return request<Topic[]>(`/api/games/${gameId}/topics/reorder`, {
    method: 'POST',
    token,
    body: JSON.stringify({ topic_ids: topicIds }),
  });
}

export async function deleteTopic(token: string, gameId: number, topicId: number): Promise<void> {
  await request<void>(`/api/games/${gameId}/topics/${topicId}`, {
    method: 'DELETE',
    token,
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
