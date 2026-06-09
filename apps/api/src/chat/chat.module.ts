import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@/auth/auth.module';
import { CreateConversationUseCase } from './application/create-conversation.usecase';
import { GetConversationUseCase } from './application/get-conversation.usecase';
import { ListConversationsUseCase } from './application/list-conversations.usecase';
import { SendMessageUseCase } from './application/send-message.usecase';
import { CONVERSATION_REPOSITORY } from './domain/ports/conversation-repository.port';
import { MESSAGE_STORE } from './domain/ports/message-store.port';
import { aiProviderFactory } from './infrastructure/ai/ai-provider.factory';
import { PrismaConversationRepository } from './infrastructure/persistence/prisma-conversation.repository';
import {
  MessageEntity,
  MessageSchema,
} from './infrastructure/persistence/message.schema';
import { MongoMessageStore } from './infrastructure/persistence/mongo-message.store';
import { ChatController } from './presentation/chat.controller';
import { ChatGateway } from './presentation/chat.gateway';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: MessageEntity.name, schema: MessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [
    CreateConversationUseCase,
    ListConversationsUseCase,
    GetConversationUseCase,
    SendMessageUseCase,
    aiProviderFactory,
    { provide: CONVERSATION_REPOSITORY, useClass: PrismaConversationRepository },
    { provide: MESSAGE_STORE, useClass: MongoMessageStore },
    ChatGateway,
  ],
})
export class ChatModule {}
