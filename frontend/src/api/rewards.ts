import { API_BASE_URL } from './config';

export type EarnedReward = {
  id: number;
  player_id: number;
  game_id: number;
  level_id: number;
  xp: number;
  badge_name: string | null;
  score: number;
  earned_at: string;
};

export type GameRewardSummary = {
  game_id: number;
  earned_xp: number;
  total_available_xp: number;
  badges: string[];
  earned_rewards: EarnedReward[];
};

export type BranchResolution = {
  action: string;
  branch_label: string;
  target_level_id: number | null;
  target_level_title: string | null;
  message: string;
};

export async function getGameRewardSummary(token: string, gameId: number): Promise<GameRewardSummary> {
  return request<GameRewardSummary>(`/api/player/games/${gameId}/rewards`, { token });
}

export async function resolveNextLevel(token: string, levelId: number, score: number): Promise<BranchResolution> {
  return request<BranchResolution>(`/api/player/levels/${levelId}/next`, {
    method: 'POST',
    token,
    body: JSON.stringify({ score }),
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
