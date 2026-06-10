import { useCallback, useState } from 'react';
import { login, register } from '../lib/auth';
import { clearAuth, getStoredUser, getToken, storeAuth } from '../lib/token';
import type { AuthResult, AuthUser } from '../lib/types';

export interface UseAuth {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, displayName: string, password: string) => Promise<void>;
  signOut: () => void;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getToken());

  const apply = useCallback((result: AuthResult) => {
    storeAuth(result);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      apply(await login(email, password));
    },
    [apply],
  );

  const signUp = useCallback(
    async (email: string, displayName: string, password: string) => {
      apply(await register(email, displayName, password));
    },
    [apply],
  );

  const signOut = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return { user, isAuthenticated: Boolean(token), signIn, signUp, signOut };
}
