import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

type AuthMode = 'player' | 'creator';

type AuthContextValue = {
  activeMode: AuthMode | null;
  error: string | null;
  isBootstrapping: boolean;
  isLoading: boolean;
  token: string | null;
  user: authApi.User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { fullName: string; email: string; password: string; role: authApi.RoleName }) => Promise<void>;
  chooseRole: (role: AuthMode) => Promise<void>;
  setActiveMode: (mode: AuthMode) => void;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenStorageKey = 'learnplay.authToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<authApi.User | null>(null);
  const [activeMode, setActiveMode] = useState<AuthMode | null>(null);
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
      .then((profile) => {
        setUser(profile);
        setActiveMode(profile.role_creator ? 'creator' : 'player');
      })
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
      login: async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
          const response = await authApi.login({ email, password });
          completeAuth(response);
        } catch (authError) {
          setError(getErrorMessage(authError));
        } finally {
          setLoading(false);
        }
      },
      signup: async ({ fullName, email, password, role }) => {
        setLoading(true);
        setError(null);
        try {
          const response = await authApi.signup({ full_name: fullName, email, password, role });
          completeAuth(response);
          setActiveMode(null);
        } catch (authError) {
          setError(getErrorMessage(authError));
        } finally {
          setLoading(false);
        }
      },
      chooseRole: async (role) => {
        if (!token) {
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const profile = await authApi.selectRole(token, role);
          setUser(profile);
          setActiveMode(role);
        } catch (authError) {
          setError(getErrorMessage(authError));
        } finally {
          setLoading(false);
        }
      },
      setActiveMode,
      logout: () => {
        persistToken(null);
        setToken(null);
        setUser(null);
        setActiveMode(null);
        setError(null);
      },
      clearError: () => setError(null),
    }),
    [activeMode, error, isBootstrapping, isLoading, token, user]
  );

  function completeAuth(response: authApi.TokenResponse) {
    persistToken(response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    setActiveMode(response.user.role_creator ? 'creator' : 'player');
  }

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

