import { API_BASE_URL } from './config';

export type Blueprint = {
  id: number;
  game_id: number;
  creator_id: number;
  title: string;
  description: string;
  total_levels: number;
  estimated_duration_minutes: number;
  topic_order: number[];
  difficulty_distribution: Record<string, number>;
  reward_style: string;
  branching_style: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
};

export type BlueprintUpdate = Partial<
  Pick<
    Blueprint,
    | 'title'
    | 'description'
    | 'total_levels'
    | 'estimated_duration_minutes'
    | 'topic_order'
    | 'difficulty_distribution'
    | 'reward_style'
    | 'branching_style'
  >
>;

export async function createBlueprint(token: string, gameId: number): Promise<Blueprint> {
  return request<Blueprint>('/api/ai/create-blueprint', {
    method: 'POST',
    token,
    body: JSON.stringify({ game_id: gameId, replace_existing: true }),
  });
}

export async function getBlueprint(token: string, gameId: number): Promise<Blueprint> {
  return request<Blueprint>(`/api/games/${gameId}/blueprint`, { token });
}

export async function updateBlueprint(token: string, gameId: number, payload: BlueprintUpdate): Promise<Blueprint> {
  return request<Blueprint>(`/api/games/${gameId}/blueprint`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function approveBlueprint(token: string, gameId: number): Promise<Blueprint> {
  return request<Blueprint>(`/api/games/${gameId}/blueprint/approve`, {
    method: 'POST',
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

  return response.json() as Promise<T>;
}
