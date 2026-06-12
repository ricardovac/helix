import { validateEnv } from './configuration';

describe('validateEnv', () => {
  it('aplica defaults e aceita o provider mock', () => {
    const env = validateEnv({});
    expect(env.AI_PROVIDER).toBe('mock');
    expect(env.API_PORT).toBe(3000);
    expect(env.MONGO_URL).toContain('mongodb://');
  });

  it('coage API_PORT de string para número', () => {
    const env = validateEnv({ API_PORT: '8080' });
    expect(env.API_PORT).toBe(8080);
  });

  it('falha quando AI_PROVIDER=azure sem credenciais', () => {
    expect(() => validateEnv({ AI_PROVIDER: 'azure' })).toThrow(/AZURE_OPENAI/);
  });

  it('ignora AZURE_OPENAI_ENDPOINT vazio quando provider é mock (caso do compose)', () => {
    const env = validateEnv({ AI_PROVIDER: 'mock', AZURE_OPENAI_ENDPOINT: '' });
    expect(env.AI_PROVIDER).toBe('mock');
    expect(env.AZURE_OPENAI_ENDPOINT).toBeUndefined();
  });

  it('ignora o endpoint placeholder quando provider é mock', () => {
    const env = validateEnv({
      AI_PROVIDER: 'mock',
      AZURE_OPENAI_ENDPOINT: 'https://<seu-recurso>.openai.azure.com',
    });
    expect(env.AI_PROVIDER).toBe('mock');
  });

  it('falha quando AI_PROVIDER=azure com endpoint inválido', () => {
    expect(() =>
      validateEnv({
        AI_PROVIDER: 'azure',
        AZURE_OPENAI_ENDPOINT: 'não-é-url',
        AZURE_OPENAI_API_KEY: 'secret',
      }),
    ).toThrow(/URL válida/);
  });

  it('aceita azure com endpoint e key válidos', () => {
    const env = validateEnv({
      AI_PROVIDER: 'azure',
      AZURE_OPENAI_ENDPOINT: 'https://exemplo.openai.azure.com',
      AZURE_OPENAI_API_KEY: 'secret',
    });
    expect(env.AI_PROVIDER).toBe('azure');
  });

  it('aceita bedrock e aplica defaults de região e modelo', () => {
    const env = validateEnv({ AI_PROVIDER: 'bedrock' });
    expect(env.AI_PROVIDER).toBe('bedrock');
    expect(env.AWS_REGION).toBe('us-east-1');
    expect(env.AWS_BEDROCK_MODEL_ID).toContain('anthropic');
  });
});
