import type { AuthResult, AuthUser } from './types';

const TOKEN_KEY = 'chatbot.token';
const USER_KEY = 'chatbot.user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function storeAuth(result: AuthResult): void {
  localStorage.setItem(TOKEN_KEY, result.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
