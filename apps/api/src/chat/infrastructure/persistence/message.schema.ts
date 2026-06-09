import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MessageRole } from '@/chat/domain/entities/message';

export type MessageDocument = HydratedDocument<MessageEntity>;

/**
 * Documento de mensagem no MongoDB (NoSQL). Stream append-only por conversa.
 */
@Schema({ collection: 'messages', timestamps: { createdAt: true, updatedAt: false } })
export class MessageEntity {
  @Prop({ required: true, index: true })
  conversationId!: string;

  @Prop({ required: true, enum: ['system', 'user', 'assistant'] })
  role!: MessageRole;

  @Prop({ required: true })
  content!: string;

  @Prop()
  tokens?: number;

  createdAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);
MessageSchema.index({ conversationId: 1, createdAt: 1 });
