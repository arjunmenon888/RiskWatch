import { API_BASE_URL } from './config';

export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export type DocumentRecord = {
  id: number;
  game_id: number;
  creator_id: number;
  filename: string;
  content_type: string;
  file_extension: string;
  status: DocumentStatus;
  error_message: string | null;
  extracted_text_char_count: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

export type DocumentChunk = {
  id: number;
  document_id: number;
  chunk_index: number;
  text: string;
  source_label: string;
};

export type DocumentDetail = DocumentRecord & {
  chunks: DocumentChunk[];
};

export async function uploadDocument(token: string, gameId: number, file: File): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);

  return request<DocumentDetail>(`/api/games/${gameId}/documents/upload`, {
    method: 'POST',
    token,
    body: formData,
  });
}

export async function listDocuments(token: string, gameId: number): Promise<DocumentRecord[]> {
  return request<DocumentRecord[]>(`/api/games/${gameId}/documents`, { token });
}

async function request<T>(path: string, options: RequestInit & { token: string }): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${options.token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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
