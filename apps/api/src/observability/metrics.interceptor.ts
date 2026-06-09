import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Mede duração e conta cada requisição HTTP, alimentando o Prometheus.
 * Usa a rota do handler (e não a URL crua) para evitar explosão de cardinalidade.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const route = (req.route?.path as string) ?? req.path ?? 'unknown';
    const endTimer = this.metrics.httpDuration.startTimer({
      method: req.method,
      route,
    });

    return next.handle().pipe(
      tap({
        next: () => this.record(req.method, route, res.statusCode, endTimer),
        error: () => this.record(req.method, route, res.statusCode || 500, endTimer),
      }),
    );
  }

  private record(
    method: string,
    route: string,
    status: number,
    endTimer: (labels?: Record<string, string | number>) => void,
  ): void {
    const labels = { method, route, status: String(status) };
    this.metrics.httpRequests.inc(labels);
    endTimer({ status: String(status) });
  }
}
