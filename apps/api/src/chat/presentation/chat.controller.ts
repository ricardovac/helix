import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateConversationUseCase } from '@/chat/application/create-conversation.usecase';
import { GetConversationUseCase } from '@/chat/application/get-conversation.usecase';
import { ListConversationsUseCase } from '@/chat/application/list-conversations.usecase';
import { SendMessageUseCase } from '@/chat/application/send-message.usecase';
import { CurrentUser } from '@/auth/presentation/current-user.decorator';
import { JwtAuthGuard } from '@/auth/presentation/jwt-auth.guard';
import { RequestUser } from '@/auth/infrastructure/jwt.strategy';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ChatController {
  constructor(
    private readonly createConversation: CreateConversationUseCase,
    private readonly listConversations: ListConversationsUseCase,
    private readonly getConversation: GetConversationUseCase,
    private readonly sendMessage: SendMessageUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova conversa' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateConversationDto) {
    return this.createConversation.execute({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Lista as conversas do usuário autenticado' })
  list(@CurrentUser() user: RequestUser, @Query('limit') limit?: string) {
    return this.listConversations.execute(user.id, limit ? Number(limit) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma conversa com seu histórico de mensagens' })
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.getConversation.execute(id, user.id);
  }

  @Post(':id/messages')
  @ApiOperation({
    summary: 'Envia uma mensagem e recebe a resposta da IA (resposta completa)',
  })
  send(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.sendMessage.execute({
      conversationId: id,
      content: dto.content,
      userId: user.id,
    });
  }
}
