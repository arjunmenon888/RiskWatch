import { API_BASE_URL } from './config';

export type Certificate = {
  id: number;
  certificate_number: string;
  player_id: number;
  game_id: number;
  publication_id: number;
  player_name: string;
  game_title: string;
  version_number: number;
  completed_at: string;
  issued_at: string;
};

export async function listCertificates(token: string): Promise<Certificate[]> {
  return request<Certificate[]>('/api/player/certificates', { token });
}

export async function claimCertificate(token: string, gameId: number): Promise<Certificate> {
  return request<Certificate>(`/api/player/games/${gameId}/certificates`, {
    method: 'POST',
    token,
  });
}

export async function downloadCertificate(token: string, certificate: Certificate): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/player/certificates/${certificate.id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }
  const blob = await response.blob();
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Certificate download is currently available on the web app.');
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `riskwatch-${certificate.certificate_number}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
    throw new Error(await errorMessage(response));
  }
  return response.json() as Promise<T>;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    return payload.detail ?? 'Something went wrong.';
  } catch {
    return response.statusText || 'Something went wrong.';
  }
}
