export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8004';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  healthUrl: `${API_BASE_URL}/health`,
};
