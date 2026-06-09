import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  type InferenceConfiguration,
} from '@aws-sdk/client-bedrock-runtime';
import { Env } from '@/config/configuration';
import { ChatMessage } from '@/chat/domain/entities/message';
import {
  AiProvider,
  CompletionOptions,
  CompletionResult,
} from '@/chat/domain/ports/ai-provider.port';
import { toBedrockConversation } from './bedrock-message-mapper';

/**
 * Adapter para AWS Bedrock via Converse API — interface unificada de mensagens
 * que funciona com Claude, Titan, Llama, etc. Implementa o mesmo port que os
 * providers Azure e Mock: adicionar a AWS ao "menu" de modelos não tocou o domínio.
 *
 * Credenciais vêm da cadeia padrão do SDK (env, IAM role, ~/.aws) — ideal para
 * rodar em ECS/EKS com IAM role, sem segredos no código.
 */
export class BedrockAiProvider implements AiProvider {
  readonly name = 'aws-bedrock';
  readonly model: string;
  private readonly logger = new Logger(BedrockAiProvider.name);
  private readonly client: BedrockRuntimeClient;

  constructor(config: ConfigService<Env, true>) {
    this.model = config.get('AWS_BEDROCK_MODEL_ID', { infer: true });
    this.client = new BedrockRuntimeClient({
      region: config.get('AWS_REGION', { infer: true }),
    });
    this.logger.log(
      `AWS Bedrock inicializado (model=${this.model}, region=${config.get('AWS_REGION', { infer: true })})`,
    );
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<CompletionResult> {
    const { system, messages: msgs } = toBedrockConversation(messages);

    const response = await this.client.send(
      new ConverseCommand({
        modelId: this.model,
        system: system.length ? system : undefined,
        messages: msgs,
        inferenceConfig: this.inferenceConfig(options),
      }),
    );

    const content =
      response.output?.message?.content
        ?.map((block) => block.text ?? '')
        .join('') ?? '';

    return {
      content,
      model: this.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.inputTokens ?? 0,
            completionTokens: response.usage.outputTokens ?? 0,
          }
        : undefined,
    };
  }

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const { system, messages: msgs } = toBedrockConversation(messages);

    const response = await this.client.send(
      new ConverseStreamCommand({
        modelId: this.model,
        system: system.length ? system : undefined,
        messages: msgs,
        inferenceConfig: this.inferenceConfig(options),
      }),
    );

    if (!response.stream) return;

    for await (const event of response.stream) {
      const token = event.contentBlockDelta?.delta?.text;
      if (token) {
        yield token;
      }
    }
  }

  private inferenceConfig(options?: CompletionOptions): InferenceConfiguration {
    const config: InferenceConfiguration = {
      temperature: options?.temperature ?? 0.7,
    };
    if (options?.maxTokens) {
      config.maxTokens = options.maxTokens;
    }
    return config;
  }
}
