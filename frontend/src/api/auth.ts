import { API_BASE_URL } from './config';

export type RoleName = 'player' | 'creator';

export type User = {
  id: number;
  email: string;
  full_name: string;
  role_player: boolean;
  role_creator: boolean;
  role_admin: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: 'bearer';
  user: User;
};

type SignupPayload = {
  full_name: string;
  email: string;
  password: string;
  role: RoleName;
};

type LoginPayload = {
  email: string;
  password: string;
};

export async function signup(payload: SignupPayload): Promise<TokenResponse> {
  return request<TokenResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  return request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string): Promise<User> {
  return request<User>('/auth/me', { token });
}

export async function selectRole(token: string, role: RoleName): Promise<User> {
  return request<User>('/auth/role', {
    method: 'POST',
    token,
    body: JSON.stringify({ role }),
  });
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

