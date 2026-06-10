import { getToken } from './token';
import type { Conversation, ConversationWithMessages } from './types';

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function listConversations(): Promise<Conversation[]> {
  return http<Conversation[]>('/conversations');
}

export function getConversation(id: string): Promise<ConversationWithMessages> {
  return http<ConversationWithMessages>(`/conversations/${id}`);
}

export function createConversation(input: {
  title?: string;
  systemPrompt?: string;
}): Promise<Conversation> {
  return http<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
