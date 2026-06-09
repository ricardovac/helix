import { Injectable } from '@nestjs/common';
import { Conversation as PrismaConversation } from '@prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';
import { Conversation, NewConversation } from '@/chat/domain/entities/conversation';
import { ConversationRepository } from '@/chat/domain/ports/conversation-repository.port';

@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
  private readonly cacheTtl = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(data: NewConversation): Promise<Conversation> {
    const row = await this.prisma.conversation.create({
      data: {
        title: data.title ?? 'Nova conversa',
        systemPrompt: data.systemPrompt ?? null,
        model: data.model ?? 'mock',
        userId: data.userId ?? null,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Conversation | null> {
    const cached = await this.redis.get<Conversation>(this.key(id));
    if (cached) {
      return this.rehydrate(cached);
    }

    const row = await this.prisma.conversation.findUnique({ where: { id } });
    if (!row) return null;

    const conversation = this.toDomain(row);
    await this.redis.set(this.key(id), conversation, this.cacheTtl);
    return conversation;
  }

  async list(userId: string, limit = 50): Promise<Conversation[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  async registerMessages(id: string, count: number): Promise<void> {
    await this.prisma.conversation.update({
      where: { id },
      data: { messageCount: { increment: count } },
    });
    await this.redis.del(this.key(id));
  }

  private key(id: string): string {
    return `conversation:${id}`;
  }

  private toDomain(row: PrismaConversation): Conversation {
    return {
      id: row.id,
      title: row.title,
      systemPrompt: row.systemPrompt,
      model: row.model,
      userId: row.userId,
      messageCount: row.messageCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private rehydrate(cached: Conversation): Conversation {
    return {
      ...cached,
      createdAt: new Date(cached.createdAt),
      updatedAt: new Date(cached.updatedAt),
    };
  }
}
