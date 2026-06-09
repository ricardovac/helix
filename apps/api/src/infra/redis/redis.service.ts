import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Env } from '@/config/configuration';

/**
 * Cliente Redis usado para cache de conversas e (via Throttler) rate limiting.
 * lazyConnect + handler de erro evitam que a app caia se o Redis estiver fora.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService<Env, true>) {
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.client.on('error', (err) =>
      this.logger.warn(`Redis erro: ${err.message}`),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Conectado ao Redis');
    } catch (err) {
      this.logger.warn(
        `Redis indisponível no boot (${(err as Error).message}). Cache desativado.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  private get ready(): boolean {
    return this.client.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.ready) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.ready) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* cache best-effort */
    }
  }

  async del(key: string): Promise<void> {
    if (!this.ready) return;
    try {
      await this.client.del(key);
    } catch {
      /* noop */
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}
