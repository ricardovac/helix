import { ConfigService } from '@nestjs/config';
import { AiProvider } from '@/chat/domain/ports/ai-provider.port';
import { aiProviderFactory } from './ai-provider.factory';

function fakeConfig(values: Record<string, unknown>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const factory = aiProviderFactory as {
  useFactory: (config: ConfigService) => AiProvider;
};

const build = (values: Record<string, unknown>): AiProvider =>
  factory.useFactory(fakeConfig(values));

describe('aiProviderFactory (orquestração de providers)', () => {
  it('usa o mock por padrão', () => {
    expect(build({ AI_PROVIDER: 'mock' }).name).toBe('mock');
  });

  it('seleciona AWS Bedrock', () => {
    const provider = build({
      AI_PROVIDER: 'bedrock',
      AWS_REGION: 'us-east-1',
      AWS_BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
    });
    expect(provider.name).toBe('aws-bedrock');
    expect(provider.model).toContain('anthropic');
  });

  it('seleciona Azure OpenAI', () => {
    const provider = build({
      AI_PROVIDER: 'azure',
      AZURE_OPENAI_ENDPOINT: 'https://exemplo.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'secret',
      AZURE_OPENAI_DEPLOYMENT: 'gpt-4o-mini',
      AZURE_OPENAI_API_VERSION: '2024-08-01-preview',
    });
    expect(provider.name).toBe('azure-openai');
  });
});
