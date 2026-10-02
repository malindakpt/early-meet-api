import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
export declare class RequestLoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: StructuredLogger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
