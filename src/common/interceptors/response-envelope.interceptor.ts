import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

import type { RequestWithId } from '../types/http-request.type.js';

export interface IApiResponse<T> {
  data: T;
  meta: {
    requestId?: string;
  };
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<unknown>> {
    const request = context.switchToHttp().getRequest<RequestWithId>();

    return next.handle().pipe(
      map((data: unknown): IApiResponse<unknown> => ({
        data,
        meta: {
          requestId: request.requestId,
        },
      })),
    );
  }
}
