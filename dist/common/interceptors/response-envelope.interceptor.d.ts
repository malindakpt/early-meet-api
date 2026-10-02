import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface IApiResponse<T> {
    data: T;
    meta: {
        requestId?: string;
    };
}
export declare class ResponseEnvelopeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<unknown>>;
}
