export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface StoredMessage extends ChatMessage {
  id: string;
  conversationId: string;
  createdAt: Date;
  tokens?: number;
}
