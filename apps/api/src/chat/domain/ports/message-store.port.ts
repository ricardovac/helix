import { ChatMessage, StoredMessage } from '../entities/message';

export interface AppendMessageInput extends ChatMessage {
  conversationId: string;
  tokens?: number;
}

/**
 * Port de saída para o histórico de mensagens em NoSQL (MongoDB).
 * Separado do repositório relacional de propósito: mensagens são um stream
 * append-only de documentos, caso de uso natural para banco de documentos.
 */
export interface MessageStore {
  append(message: AppendMessageInput): Promise<StoredMessage>;
  listByConversation(
    conversationId: string,
    limit?: number,
  ): Promise<StoredMessage[]>;
}

export const MESSAGE_STORE = Symbol('MESSAGE_STORE');
