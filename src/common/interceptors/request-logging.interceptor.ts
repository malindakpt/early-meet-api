import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import type { RequestWithId } from '../types/http-request.type.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<{ statusCode: number }>();
    const startedAt = performance.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log('HTTP request completed', {
            event: 'http.request.completed',
            requestId: request.requestId,
            method: request.method,
            path: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: Math.round(performance.now() - startedAt),
          });
        },
      }),
    );
  }
}
