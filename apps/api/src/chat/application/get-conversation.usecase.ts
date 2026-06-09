import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Conversation } from '../domain/entities/conversation';
import { StoredMessage } from '../domain/entities/message';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '../domain/ports/conversation-repository.port';
import {
  MESSAGE_STORE,
  MessageStore,
} from '../domain/ports/message-store.port';

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: StoredMessage[];
}

@Injectable()
export class GetConversationUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_STORE)
    private readonly messages: MessageStore,
  ) {}

  async execute(
    conversationId: string,
    userId: string,
  ): Promise<ConversationWithMessages> {
    const conversation = await this.conversations.findById(conversationId);
    // Trata "não é dono" como 404 para não revelar a existência da conversa.
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException(`Conversa ${conversationId} não encontrada`);
    }
    const messages = await this.messages.listByConversation(conversationId);
    return { conversation, messages };
  }
}
