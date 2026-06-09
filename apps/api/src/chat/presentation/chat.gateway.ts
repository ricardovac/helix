import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '@/auth/domain/user.entity';
import { SendMessageUseCase } from '@/chat/application/send-message.usecase';

interface IncomingMessage {
  conversationId: string;
  content: string;
}

interface SocketUser {
  id: string;
  email: string;
}

/**
 * Canal de streaming em tempo real, autenticado por JWT no handshake.
 * O cliente conecta com `auth: { token }` e emite `message`; recebe `token`
 * (parciais) e `done` (mensagem final persistida).
 */
@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly sendMessage: SendMessageUseCase,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const payload = this.jwt.verify<JwtPayload>(this.extractToken(client));
      const user: SocketUser = { id: payload.sub, email: payload.email };
      client.data.user = user;
      this.logger.debug(`Cliente autenticado: ${client.id} (${user.email})`);
    } catch {
      client.emit('error', { message: 'Não autenticado' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() body: IncomingMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      client.emit('error', { message: 'Não autenticado' });
      return;
    }
    if (!body?.conversationId || !body?.content?.trim()) {
      client.emit('error', { message: 'conversationId e content são obrigatórios' });
      return;
    }

    try {
      const result = await this.sendMessage.streamReply(
        {
          conversationId: body.conversationId,
          content: body.content,
          userId: user.id,
        },
        (token) => client.emit('token', { token }),
      );
      client.emit('done', { message: result.assistantMessage });
    } catch (err) {
      this.logger.error(`Erro no streaming: ${(err as Error).message}`);
      client.emit('error', { message: (err as Error).message });
    }
  }

  private extractToken(client: Socket): string {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    const header = client.handshake.headers?.authorization;
    const raw = fromAuth ?? header;
    if (!raw) {
      throw new Error('Token ausente');
    }
    return raw.replace(/^Bearer\s+/i, '');
  }
}
