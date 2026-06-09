import { MetricsService } from '@/observability/metrics.service';
import { Conversation, NewConversation } from '../domain/entities/conversation';
import { StoredMessage } from '../domain/entities/message';
import { ConversationRepository } from '../domain/ports/conversation-repository.port';
import {
  AppendMessageInput,
  MessageStore,
} from '../domain/ports/message-store.port';
import { MockAiProvider } from '../infrastructure/ai/mock.provider';
import { SendMessageUseCase } from './send-message.usecase';

class InMemoryConversationRepository implements ConversationRepository {
  private store = new Map<string, Conversation>();

  async create(data: NewConversation): Promise<Conversation> {
    const now = new Date();
    const conversation: Conversation = {
      id: `conv-${this.store.size + 1}`,
      title: data.title ?? 'Nova conversa',
      systemPrompt: data.systemPrompt ?? null,
      model: data.model ?? 'mock',
      userId: data.userId ?? null,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(conversation.id, conversation);
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.store.get(id) ?? null;
  }

  async list(userId: string): Promise<Conversation[]> {
    return [...this.store.values()].filter((c) => c.userId === userId);
  }

  async registerMessages(id: string, count: number): Promise<void> {
    const conv = this.store.get(id);
    if (conv) conv.messageCount += count;
  }
}

class InMemoryMessageStore implements MessageStore {
  messages: StoredMessage[] = [];

  async append(message: AppendMessageInput): Promise<StoredMessage> {
    const stored: StoredMessage = {
      id: `msg-${this.messages.length + 1}`,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      tokens: message.tokens,
      createdAt: new Date(),
    };
    this.messages.push(stored);
    return stored;
  }

  async listByConversation(conversationId: string): Promise<StoredMessage[]> {
    return this.messages.filter((m) => m.conversationId === conversationId);
  }
}

describe('SendMessageUseCase', () => {
  let repo: InMemoryConversationRepository;
  let store: InMemoryMessageStore;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    repo = new InMemoryConversationRepository();
    store = new InMemoryMessageStore();
    useCase = new SendMessageUseCase(
      repo,
      store,
      new MockAiProvider(),
      new MetricsService(),
    );
  });

  it('persiste a mensagem do usuário e a resposta da IA', async () => {
    const conversation = await repo.create({ title: 'Teste', userId: 'user-1' });

    const result = await useCase.execute({
      conversationId: conversation.id,
      content: 'Como você está?',
      userId: 'user-1',
    });

    expect(result.userMessage.role).toBe('user');
    expect(result.assistantMessage.role).toBe('assistant');
    expect(result.assistantMessage.content.length).toBeGreaterThan(0);
    expect(store.messages).toHaveLength(2);

    const updated = await repo.findById(conversation.id);
    expect(updated?.messageCount).toBe(2);
  });

  it('lança NotFound para conversa inexistente', async () => {
    await expect(
      useCase.execute({ conversationId: 'nao-existe', content: 'oi', userId: 'user-1' }),
    ).rejects.toThrow(/não encontrada/);
  });

  it('lança NotFound quando a conversa é de outro usuário', async () => {
    const conversation = await repo.create({ userId: 'dono' });
    await expect(
      useCase.execute({
        conversationId: conversation.id,
        content: 'oi',
        userId: 'intruso',
      }),
    ).rejects.toThrow(/não encontrada/);
  });

  it('faz streaming chamando o callback de token e persiste o resultado', async () => {
    const conversation = await repo.create({ userId: 'user-1' });
    const tokens: string[] = [];

    const result = await useCase.streamReply(
      { conversationId: conversation.id, content: 'streaming?', userId: 'user-1' },
      (token) => tokens.push(token),
    );

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toBe(result.assistantMessage.content);
  });
});
