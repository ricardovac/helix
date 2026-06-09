import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * Módulo global de observabilidade: expõe o MetricsService para toda a app
 * (logs estruturados ficam no nestjs-pino, configurado no AppModule).
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}
