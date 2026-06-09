import { ChatMessage } from '@/chat/domain/entities/message';
import { toBedrockConversation } from './bedrock-message-mapper';

describe('toBedrockConversation', () => {
  it('separa o system prompt das mensagens (formato Converse API)', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Você é objetivo.' },
      { role: 'user', content: 'Olá' },
      { role: 'assistant', content: 'Oi!' },
      { role: 'user', content: 'Tudo bem?' },
    ];

    const result = toBedrockConversation(messages);

    expect(result.system).toEqual([{ text: 'Você é objetivo.' }]);
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0]).toEqual({
      role: 'user',
      content: [{ text: 'Olá' }],
    });
    expect(result.messages.every((m) => m.role !== 'system')).toBe(true);
  });

  it('funciona sem system prompt', () => {
    const result = toBedrockConversation([{ role: 'user', content: 'oi' }]);
    expect(result.system).toEqual([]);
    expect(result.messages).toHaveLength(1);
  });
});
