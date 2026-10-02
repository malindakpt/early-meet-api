import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';

import type { RequestWithId } from '../types/http-request.type.js';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const providedRequestId = request.header('x-request-id');
    const requestId =
      providedRequestId !== undefined && REQUEST_ID_PATTERN.test(providedRequestId)
        ? providedRequestId
        : `req_${randomUUID()}`;

    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    next();
  }
}
