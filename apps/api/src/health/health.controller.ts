import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { MongoHealthIndicator } from './mongo.health';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly mongo: MongoHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness — o processo está de pé' })
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness — dependências (Postgres/Mongo/Redis) prontas' })
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prisma.isHealthy(),
      () => this.mongo.isHealthy(),
      () => this.redis.isHealthy(),
    ]);
  }
}
