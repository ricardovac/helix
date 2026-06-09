import { Conversation, NewConversation } from '../entities/conversation';

/**
 * Port de saída para persistência relacional de conversas (Postgres/Prisma).
 */
export interface ConversationRepository {
  create(data: NewConversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  list(userId: string, limit?: number): Promise<Conversation[]>;
  registerMessages(id: string, count: number): Promise<void>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
