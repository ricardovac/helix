import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoredMessage } from '@/chat/domain/entities/message';
import {
  AppendMessageInput,
  MessageStore,
} from '@/chat/domain/ports/message-store.port';
import { MessageDocument, MessageEntity } from './message.schema';

@Injectable()
export class MongoMessageStore implements MessageStore {
  constructor(
    @InjectModel(MessageEntity.name)
    private readonly model: Model<MessageDocument>,
  ) {}

  async append(message: AppendMessageInput): Promise<StoredMessage> {
    const doc = await this.model.create({
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      tokens: message.tokens,
    });
    return this.toDomain(doc);
  }

  async listByConversation(
    conversationId: string,
    limit = 200,
  ): Promise<StoredMessage[]> {
    const docs = await this.model
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: MessageDocument): StoredMessage {
    return {
      id: doc._id.toString(),
      conversationId: doc.conversationId,
      role: doc.role,
      content: doc.content,
      tokens: doc.tokens,
      createdAt: doc.createdAt,
    };
  }
}
