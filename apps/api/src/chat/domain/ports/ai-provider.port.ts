import { ChatMessage } from '../entities/message';

export interface CompletionUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage?: CompletionUsage;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Port de saída para qualquer provedor de IA (Azure OpenAI, mock, futuramente
 * AWS Bedrock...). A camada de aplicação depende só desta interface.
 */
export interface AiProvider {
  /** Identificador legível do provider (ex.: "azure-openai", "mock"). */
  readonly name: string;

  /** Modelo/deployment ativo. */
  readonly model: string;

  /** Completion síncrona (resposta completa). */
  complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<CompletionResult>;

  /** Completion em streaming (emite os tokens conforme chegam). */
  stream(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
