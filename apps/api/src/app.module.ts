import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { Env, validateEnv } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { MetricsInterceptor } from './observability/metrics.interceptor';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),

    // Logs estruturados (JSON em prod, bonito em dev) com request-id por requisição.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isProd = config.get('NODE_ENV', { infer: true }) === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            transport: isProd
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            genReqId: (req, res) => {
              const existing = req.headers['x-request-id'];
              const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
          },
        };
      },
    }),

    // Rate limiting: 60 requisições por minuto por IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGO_URL', { infer: true }),
        serverSelectionTimeoutMS: 4000,
      }),
    }),

    ObservabilityModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
