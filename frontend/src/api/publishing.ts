import { API_BASE_URL } from './config';

export type PublishCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type PublishValidation = {
  game_id: number;
  can_publish: boolean;
  checks: PublishCheck[];
};

export type PublishedVersion = {
  id: number;
  game_id: number;
  version_number: number;
  is_active: boolean;
  published_at: string;
};

export type GamePreview = {
  game: Record<string, unknown>;
  levels: Array<Record<string, unknown>>;
  validation: PublishValidation;
  active_version: PublishedVersion | null;
};

export type PublishGameResult = {
  validation: PublishValidation;
  version: PublishedVersion;
};

export async function getGamePreview(token: string, gameId: number): Promise<GamePreview> {
  return request<GamePreview>(`/api/games/${gameId}/publishing/preview`, { token });
}

export async function validateGame(token: string, gameId: number): Promise<PublishValidation> {
  return request<PublishValidation>(`/api/games/${gameId}/publishing/validate`, { token });
}

export async function publishGame(token: string, gameId: number): Promise<PublishGameResult> {
  return request<PublishGameResult>(`/api/games/${gameId}/publishing/publish`, {
    method: 'POST',
    token,
  });
}

export async function unpublishGame(token: string, gameId: number): Promise<PublishedVersion> {
  return request<PublishedVersion>(`/api/games/${gameId}/publishing/unpublish`, {
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
