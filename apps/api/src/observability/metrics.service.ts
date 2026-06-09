import { Injectable } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Métricas Prometheus da aplicação.
 * Expostas em GET /metrics (ver MetricsController) para scraping.
 */
@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  readonly httpRequests: Counter<string>;
  readonly httpDuration: Histogram<string>;
  readonly aiRequests: Counter<string>;
  readonly aiTokens: Counter<string>;
  readonly aiLatency: Histogram<string>;

  constructor() {
    this.registry.setDefaultLabels({ app: 'helix-api' });
    collectDefaultMetrics({ register: this.registry });

    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.aiRequests = new Counter({
      name: 'ai_completions_total',
      help: 'Total de completions geradas, por provider/modelo/status',
      labelNames: ['provider', 'model', 'status'],
      registers: [this.registry],
    });

    this.aiTokens = new Counter({
      name: 'ai_tokens_total',
      help: 'Total de tokens consumidos, por tipo (prompt/completion)',
      labelNames: ['provider', 'model', 'type'],
      registers: [this.registry],
    });

    this.aiLatency = new Histogram({
      name: 'ai_completion_duration_seconds',
      help: 'Latência das completions de IA em segundos',
      labelNames: ['provider', 'model'],
      buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
