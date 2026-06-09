import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '@/infra/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.client.ping();
      if (pong === 'PONG') {
        return this.getStatus(key, true);
      }
      throw new Error(`resposta inesperada: ${pong}`);
    } catch (err) {
      throw new HealthCheckError(
        'Redis indisponível',
        this.getStatus(key, false, { message: (err as Error).message }),
      );
    }
  }
}
