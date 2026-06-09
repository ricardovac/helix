import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MetricsService } from '@/observability/metrics.service';
import { Conversation } from '../domain/entities/conversation';
import { ChatMessage, StoredMessage } from '../domain/entities/message';
import {
  AI_PROVIDER,
  AiProvider,
} from '../domain/ports/ai-provider.port';
import {
  CONVERSATION_REPOSITORY,
  ConversationRepository,
} from '../domain/ports/conversation-repository.port';
import {
  MESSAGE_STORE,
  MessageStore,
} from '../domain/ports/message-store.port';

export interface SendMessageInput {
  conversationId: string;
  content: string;
  userId: string;
}

export interface SendMessageResult {
  conversation: Conversation;
  userMessage: StoredMessage;
  assistantMessage: StoredMessage;
}

/**
 * Caso de uso central: recebe a mensagem do usuário, monta o contexto
 * (system prompt + histórico), chama o provider de IA, persiste as duas
 * mensagens e registra métricas. Suporta resposta completa e streaming.
 */
@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_STORE)
    private readonly messages: MessageStore,
    @Inject(AI_PROVIDER)
    private readonly ai: AiProvider,
    private readonly metrics: MetricsService,
  ) {}

  /** Resposta completa (usada pelo endpoint REST). */
  async execute(input: SendMessageInput): Promise<SendMessageResult> {
    const { conversation, context, userMessage } = await this.prepare(input);
    const stop = this.metrics.aiLatency.startTimer({
      provider: this.ai.name,
      model: this.ai.model,
    });

    try {
      const result = await this.ai.complete(context);
      stop();
      this.recordSuccess(result.usage?.promptTokens, result.usage?.completionTokens);

      const assistantMessage = await this.persistAssistant(
        conversation,
        result.content,
        result.usage?.completionTokens,
      );
      return { conversation, userMessage, assistantMessage };
    } catch (err) {
      stop();
      this.metrics.aiRequests.inc({
        provider: this.ai.name,
        model: this.ai.model,
        status: 'error',
      });
      throw err;
    }
  }

  /**
   * Streaming: emite cada token via callback e persiste a resposta completa
   * ao final. Usado pelo WebSocket gateway.
   */
  async streamReply(
    input: SendMessageInput,
    onToken: (token: string) => void,
  ): Promise<SendMessageResult> {
    const { conversation, context, userMessage } = await this.prepare(input);
    const stop = this.metrics.aiLatency.startTimer({
      provider: this.ai.name,
      model: this.ai.model,
    });

    let buffer = '';
    try {
      for await (const token of this.ai.stream(context)) {
        buffer += token;
        onToken(token);
      }
      stop();
      const completionTokens = this.estimateTokens(buffer);
      this.recordSuccess(undefined, completionTokens);

      const assistantMessage = await this.persistAssistant(
        conversation,
        buffer,
        completionTokens,
      );
      return { conversation, userMessage, assistantMessage };
    } catch (err) {
      stop();
      this.metrics.aiRequests.inc({
        provider: this.ai.name,
        model: this.ai.model,
        status: 'error',
      });
      throw err;
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────

  private async prepare(input: SendMessageInput): Promise<{
    conversation: Conversation;
    context: ChatMessage[];
    userMessage: StoredMessage;
  }> {
    const content = input.content?.trim();
    if (!content) {
      throw new NotFoundException('Mensagem vazia');
    }

    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation || conversation.userId !== input.userId) {
      throw new NotFoundException(
        `Conversa ${input.conversationId} não encontrada`,
      );
    }

    const history = await this.messages.listByConversation(conversation.id);
    const context: ChatMessage[] = [];
    if (conversation.systemPrompt) {
      context.push({ role: 'system', content: conversation.systemPrompt });
    }
    context.push(...history.map(({ role, content: c }) => ({ role, content: c })));
    context.push({ role: 'user', content });

    const userMessage = await this.messages.append({
      conversationId: conversation.id,
      role: 'user',
      content,
      tokens: this.estimateTokens(content),
    });

    return { conversation, context, userMessage };
  }

  private async persistAssistant(
    conversation: Conversation,
    content: string,
    tokens?: number,
  ): Promise<StoredMessage> {
    const assistantMessage = await this.messages.append({
      conversationId: conversation.id,
      role: 'assistant',
      content,
      tokens,
    });
    await this.conversations.registerMessages(conversation.id, 2);
    return assistantMessage;
  }

  private recordSuccess(promptTokens?: number, completionTokens?: number): void {
    this.metrics.aiRequests.inc({
      provider: this.ai.name,
      model: this.ai.model,
      status: 'success',
    });
    if (promptTokens) {
      this.metrics.aiTokens.inc(
        { provider: this.ai.name, model: this.ai.model, type: 'prompt' },
        promptTokens,
      );
    }
    if (completionTokens) {
      this.metrics.aiTokens.inc(
        { provider: this.ai.name, model: this.ai.model, type: 'completion' },
        completionTokens,
      );
    }
  }

  private estimateTokens(text: string): number {
    // Aproximação grosseira (~4 chars/token) para quando o provider não
    // devolve usage (ex.: streaming do mock).
    return Math.max(1, Math.round(text.length / 4));
  }
}
