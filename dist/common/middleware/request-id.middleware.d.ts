import { type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { RequestWithId } from '../types/http-request.type.js';
export declare class RequestIdMiddleware implements NestMiddleware {
    use(request: RequestWithId, response: Response, next: NextFunction): void;
}
