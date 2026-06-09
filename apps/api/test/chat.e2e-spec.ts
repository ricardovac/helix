import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateConversationUseCase } from '@/chat/application/create-conversation.usecase';
import { GetConversationUseCase } from '@/chat/application/get-conversation.usecase';
import { ListConversationsUseCase } from '@/chat/application/list-conversations.usecase';
import { SendMessageUseCase } from '@/chat/application/send-message.usecase';
import { ChatController } from '@/chat/presentation/chat.controller';
import { JwtAuthGuard } from '@/auth/presentation/jwt-auth.guard';

/**
 * E2E da camada HTTP: exercita rotas, ValidationPipe e serialização
 * com os casos de uso mockados (não depende de Postgres/Mongo/Redis).
 */
describe('ChatController (e2e)', () => {
  let app: INestApplication;

  const conversation = {
    id: 'conv-1',
    title: 'Nova conversa',
    systemPrompt: null,
    model: 'mock',
    userId: null,
    messageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createConversation = { execute: jest.fn().mockResolvedValue(conversation) };
  const sendMessage = {
    execute: jest.fn().mockResolvedValue({
      conversation,
      userMessage: { id: 'm1', role: 'user', content: 'oi' },
      assistantMessage: { id: 'm2', role: 'assistant', content: 'olá!' },
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: CreateConversationUseCase, useValue: createConversation },
        { provide: ListConversationsUseCase, useValue: { execute: jest.fn().mockResolvedValue([conversation]) } },
        { provide: GetConversationUseCase, useValue: { execute: jest.fn() } },
        { provide: SendMessageUseCase, useValue: sendMessage },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = { id: 'user-1', email: 'a@b.c' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /conversations cria uma conversa', async () => {
    const res = await request(app.getHttpServer())
      .post('/conversations')
      .send({ title: 'Nova conversa' })
      .expect(201);
    expect(res.body.id).toBe('conv-1');
    expect(createConversation.execute).toHaveBeenCalled();
  });

  it('GET /conversations lista conversas', async () => {
    const res = await request(app.getHttpServer()).get('/conversations').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it('POST /conversations/:id/messages retorna a resposta da IA', async () => {
    const res = await request(app.getHttpServer())
      .post('/conversations/conv-1/messages')
      .send({ content: 'oi' })
      .expect(201);
    expect(res.body.assistantMessage.content).toBe('olá!');
  });

  it('rejeita payload inválido (content vazio) com 400', async () => {
    await request(app.getHttpServer())
      .post('/conversations/conv-1/messages')
      .send({ content: '' })
      .expect(400);
  });

  it('rejeita propriedades não permitidas com 400', async () => {
    await request(app.getHttpServer())
      .post('/conversations')
      .send({ hacker: true })
      .expect(400);
  });
});
