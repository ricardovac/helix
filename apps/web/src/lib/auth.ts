import { API_URL } from './api';
import type { AuthResult } from './types';

function extractError(text: string, status: number): string {
  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join('; ');
    if (parsed.message) return parsed.message;
  } catch {
    /* corpo não-JSON */
  }
  return `Erro ${status}`;
}

async function post(path: string, body: unknown): Promise<AuthResult> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(extractError(await res.text(), res.status));
  }
  return res.json() as Promise<AuthResult>;
}

export function login(email: string, password: string): Promise<AuthResult> {
  return post('/auth/login', { email, password });
}

export function register(
  email: string,
  displayName: string,
  password: string,
): Promise<AuthResult> {
  return post('/auth/register', { email, displayName, password });
}
