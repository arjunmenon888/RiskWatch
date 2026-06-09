import { googleLogout } from '@react-oauth/google';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

type AuthMode = 'player' | 'creator';

type AuthContextValue = {
  activeMode: AuthMode;
  error: string | null;
  isBootstrapping: boolean;
  isLoading: boolean;
  token: string | null;
  user: authApi.User | null;
  authenticateWithGoogle: (credential: string) => Promise<void>;
  setActiveMode: (mode: AuthMode) => void;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenStorageKey = 'riskwatch.authToken.v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<authApi.User | null>(null);
  const [activeMode, setActiveMode] = useState<AuthMode>('creator');
  const [isBootstrapping, setBootstrapping] = useState(Boolean(token));
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }

    authApi
      .getMe(token)
      .then(setUser)
      .catch(() => {
        persistToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setBootstrapping(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      activeMode,
      error,
      isBootstrapping,
      isLoading,
      token,
      user,
      authenticateWithGoogle: async (credential) => {
        setLoading(true);
        setError(null);
        try {
          const response = await authApi.authenticateWithGoogle(credential);
          persistToken(response.access_token);
          setToken(response.access_token);
          setUser(response.user);
          setActiveMode('creator');
        } catch (authError) {
          setError(getErrorMessage(authError));
        } finally {
          setLoading(false);
        }
      },
      setActiveMode,
      logout: () => {
        googleLogout();
        persistToken(null);
        setToken(null);
        setUser(null);
        setActiveMode('creator');
        setError(null);
      },
      clearError: () => setError(null),
    }),
    [activeMode, error, isBootstrapping, isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}

function readStoredToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  localStorage.removeItem('riskwatch.authToken');
  return localStorage.getItem(tokenStorageKey);
}

function persistToken(value: string | null) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  if (value) {
    localStorage.setItem(tokenStorageKey, value);
  } else {
    localStorage.removeItem(tokenStorageKey);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}
