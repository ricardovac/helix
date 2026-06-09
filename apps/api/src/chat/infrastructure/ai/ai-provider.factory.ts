import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/configuration';
import { AI_PROVIDER, AiProvider } from '@/chat/domain/ports/ai-provider.port';
import { AzureOpenAiProvider } from './azure-openai.provider';
import { BedrockAiProvider } from './bedrock.provider';
import { MockAiProvider } from './mock.provider';

/**
 * Seleciona o provider de IA em tempo de boot conforme AI_PROVIDER.
 * Esse ponto único de troca é o que viabiliza "orquestração de modelos":
 * adicionar AWS Bedrock = novo adapter + um case aqui, sem tocar no domínio.
 */
export const aiProviderFactory: Provider = {
  provide: AI_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): AiProvider => {
    const logger = new Logger('AiProviderFactory');
    const kind = config.get('AI_PROVIDER', { infer: true });

    switch (kind) {
      case 'azure':
        logger.log('Provider de IA selecionado: Azure OpenAI');
        return new AzureOpenAiProvider(config);
      case 'bedrock':
        logger.log('Provider de IA selecionado: AWS Bedrock');
        return new BedrockAiProvider(config);
      case 'mock':
      default:
        logger.log('Provider de IA selecionado: Mock (offline)');
        return new MockAiProvider();
    }
  },
};
