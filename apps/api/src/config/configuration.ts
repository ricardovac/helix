import { z } from 'zod';

/**
 * Variáveis opcionais costumam chegar como string vazia via docker-compose
 * (`${VAR:-}`). Tratamos "" e espaços como ausente para não falhar validações
 * de campos que só importam quando o provider correspondente está ativo.
 */
const blankToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/**
 * Schema único de configuração da aplicação.
 * Validado no boot — a aplicação não sobe com env inválida (fail fast).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('*'),

  // Provider de IA
  AI_PROVIDER: z.enum(['azure', 'bedrock', 'mock']).default('mock'),
  // A URL só é validada quando AI_PROVIDER=azure (ver validateEnv), para que o
  // modo mock suba mesmo com a variável vazia/placeholder vinda do compose.
  AZURE_OPENAI_ENDPOINT: z.preprocess(blankToUndefined, z.string().optional()),
  AZURE_OPENAI_API_KEY: z.preprocess(blankToUndefined, z.string().optional()),
  AZURE_OPENAI_DEPLOYMENT: z.string().default('gpt-4o-mini'),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-08-01-preview'),

  // AWS Bedrock (credenciais vêm da cadeia padrão do SDK: env, IAM role, ~/.aws)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-haiku-20240307-v1:0'),

  // Autenticação JWT
  JWT_SECRET: z.string().min(8).default('dev-secret-change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // Bancos
  DATABASE_URL: z.string().optional(),
  MONGO_URL: z.string().default('mongodb://localhost:27017/chatbot'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${issues}`);
  }

  if (parsed.data.AI_PROVIDER === 'azure') {
    if (!parsed.data.AZURE_OPENAI_ENDPOINT || !parsed.data.AZURE_OPENAI_API_KEY) {
      throw new Error(
        'AI_PROVIDER=azure requer AZURE_OPENAI_ENDPOINT e AZURE_OPENAI_API_KEY definidos.',
      );
    }
    try {
      new URL(parsed.data.AZURE_OPENAI_ENDPOINT);
    } catch {
      throw new Error('AZURE_OPENAI_ENDPOINT deve ser uma URL válida.');
    }
  }

  return parsed.data;
}
