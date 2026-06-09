import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(key = 'mongodb'): Promise<HealthIndicatorResult> {
    const connected = this.connection.readyState === 1;
    if (connected) {
      return this.getStatus(key, true);
    }
    throw new HealthCheckError(
      'MongoDB indisponível',
      this.getStatus(key, false, { readyState: this.connection.readyState }),
    );
  }
}
