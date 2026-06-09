import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';
import type {
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { Env } from '@/config/configuration';
import { ChatMessage } from '@/chat/domain/entities/message';
import {
  AiProvider,
  CompletionOptions,
  CompletionResult,
} from '@/chat/domain/ports/ai-provider.port';

/**
 * Adapter para Azure OpenAI usando o SDK oficial `openai`.
 * Implementa o mesmo port que o MockAiProvider — a aplicação não sabe a diferença.
 */
export class AzureOpenAiProvider implements AiProvider {
  readonly name = 'azure-openai';
  readonly model: string;
  private readonly logger = new Logger(AzureOpenAiProvider.name);
  private readonly client: AzureOpenAI;

  constructor(config: ConfigService<Env, true>) {
    this.model = config.get('AZURE_OPENAI_DEPLOYMENT', { infer: true });
    this.client = new AzureOpenAI({
      endpoint: config.get('AZURE_OPENAI_ENDPOINT', { infer: true }),
      apiKey: config.get('AZURE_OPENAI_API_KEY', { infer: true }),
      apiVersion: config.get('AZURE_OPENAI_API_VERSION', { infer: true }),
      deployment: this.model,
    });
    this.logger.log(`Azure OpenAI inicializado (deployment=${this.model})`);
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<CompletionResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: this.toSdkMessages(messages),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    });

    const choice = completion.choices[0];
    return {
      content: choice?.message?.content ?? '',
      model: completion.model ?? this.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: this.toSdkMessages(messages),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  }

  private toSdkMessages(
    messages: ChatMessage[],
  ): ChatCompletionMessageParam[] {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }
}
