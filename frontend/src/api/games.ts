import { API_BASE_URL } from './config';

export type GameVisibility = 'private' | 'unlisted' | 'public';
export type GameStatus = 'draft' | 'published' | 'archived';
export type GameCreationMode = 'ai' | 'manual';

export type Game = {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  category: string;
  visibility: GameVisibility;
  status: GameStatus;
  creation_mode: GameCreationMode;
  created_at: string;
  updated_at: string;
};

export type GameDraftPayload = {
  title: string;
  description: string;
  category: string;
  visibility: GameVisibility;
  creation_mode: GameCreationMode;
};

export async function listGames(token: string): Promise<Game[]> {
  return request<Game[]>('/creator/games', { token });
}

export async function createGame(token: string, payload: GameDraftPayload): Promise<Game> {
  return request<Game>('/creator/games', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateGame(token: string, gameId: number, payload: Partial<GameDraftPayload>): Promise<Game> {
  return request<Game>(`/creator/games/${gameId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteGame(token: string, gameId: number): Promise<void> {
  await request<void>(`/creator/games/${gameId}`, {
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
