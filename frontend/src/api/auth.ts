import { API_BASE_URL } from './config';

export type User = {
  id: number;
  email: string;
  name: string;
  profile_image: string | null;
  provider: string;
  email_verified: boolean;
  role: 'creator_player';
};

export type TokenResponse = {
  access_token: string;
  token_type: 'bearer';
  user: User;
};

export async function authenticateWithGoogle(credential: string): Promise<TokenResponse> {
  return request<TokenResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function getMe(token: string): Promise<User> {
  return request<User>('/auth/me', { token });
}

export async function forgotPassword(email: string): Promise<string> {
  const response = await request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return response.message;
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const response = await request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  return response.message;
}

async function request<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
