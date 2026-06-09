import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/configuration';
import { Conversation, NewConversation } from '../domain/entities/conversation';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '../domain/ports/conversation-repository.port';

@Injectable()
export class CreateConversationUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    private readonly config: ConfigService<Env, true>,
  ) {}

  execute(input: NewConversation): Promise<Conversation> {
    const defaultModel = this.resolveDefaultModel();

    return this.conversations.create({
      title: input.title?.trim() || 'Nova conversa',
      systemPrompt: input.systemPrompt ?? null,
      model: input.model ?? defaultModel,
      userId: input.userId ?? null,
    });
  }

  private resolveDefaultModel(): string {
    switch (this.config.get('AI_PROVIDER', { infer: true })) {
      case 'azure':
        return this.config.get('AZURE_OPENAI_DEPLOYMENT', { infer: true });
      case 'bedrock':
        return this.config.get('AWS_BEDROCK_MODEL_ID', { infer: true });
      default:
        return 'mock';
    }
  }
}

