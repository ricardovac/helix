import { ChatMessage } from '@/chat/domain/entities/message';
import {
  AiProvider,
  CompletionOptions,
  CompletionResult,
} from '@/chat/domain/ports/ai-provider.port';

/**
 * Provider offline para desenvolvimento/demos e testes — não chama rede.
 * Gera uma resposta determinística-ish baseada na última mensagem do usuário.
 */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  readonly model = 'mock';

  async complete(
    messages: ChatMessage[],
    _options?: CompletionOptions,
  ): Promise<CompletionResult> {
    const content = this.buildReply(messages);
    return {
      content,
      model: this.model,
      usage: {
        promptTokens: this.estimate(messages.map((m) => m.content).join(' ')),
        completionTokens: this.estimate(content),
      },
    };
  }

  async *stream(
    messages: ChatMessage[],
    _options?: CompletionOptions,
  ): AsyncIterable<string> {
    const reply = this.buildReply(messages);
    const chunks = reply.match(/\S+\s*/g) ?? [reply];
    for (const chunk of chunks) {
      await this.delay(25);
      yield chunk;
    }
  }

  private buildReply(messages: ChatMessage[]): string {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const question = lastUser?.content?.trim() ?? '';
    const turns = messages.filter((m) => m.role !== 'system').length;

    if (!question) {
      return 'Olá! Sou um assistente de demonstração rodando em modo *mock* (sem custo de API). Como posso ajudar?';
    }

    return [
      `Recebi sua mensagem: "${question}".`,
      '',
      'Estou rodando no provider **mock** — útil para desenvolver, testar e fazer demos sem credenciais de IA.',
      'Para respostas reais, defina `AI_PROVIDER=azure` e as variáveis do Azure OpenAI no `.env`.',
      '',
      `_(turno ${Math.ceil(turns / 2)} desta conversa)_`,
    ].join('\n');
  }

  private estimate(text: string): number {
    return Math.max(1, Math.round(text.length / 4));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
