export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  systemPrompt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}
