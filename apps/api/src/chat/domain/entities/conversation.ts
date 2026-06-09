export interface Conversation {
  id: string;
  title: string;
  systemPrompt: string | null;
  model: string;
  userId: string | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewConversation {
  title?: string;
  systemPrompt?: string | null;
  model?: string;
  userId?: string | null;
}
