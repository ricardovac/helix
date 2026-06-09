import { ChatMessage } from '@/chat/domain/entities/message';
import { MockAiProvider } from './mock.provider';

describe('MockAiProvider', () => {
  const provider = new MockAiProvider();
  const messages: ChatMessage[] = [{ role: 'user', content: 'Olá' }];

  it('retorna conteúdo e usage no complete', async () => {
    const result = await provider.complete(messages);
    expect(result.content).toContain('Olá');
    expect(result.model).toBe('mock');
    expect(result.usage?.completionTokens).toBeGreaterThan(0);
  });

  it('faz streaming cujos tokens reconstroem a resposta completa', async () => {
    let streamed = '';
    for await (const token of provider.stream(messages)) {
      streamed += token;
    }
    const full = await provider.complete(messages);
    expect(streamed).toBe(full.content);
  });
});
