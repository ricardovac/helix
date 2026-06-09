import { Inject, Injectable } from '@nestjs/common';
import { Conversation } from '../domain/entities/conversation';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '../domain/ports/conversation-repository.port';

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
  ) {}

  execute(userId: string, limit = 50): Promise<Conversation[]> {
    return this.conversations.list(userId, limit);
  }
}
