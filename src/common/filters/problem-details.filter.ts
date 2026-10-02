import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';

import { serializeError } from '../../infrastructure/logging/error-serializer.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import type { RequestWithId } from '../types/http-request.type.js';

interface IProblemDetails {
  code: string;
  detail: string;
  requestId?: string;
  status: number;
  title: string;
  type: string;
}

interface IExceptionResponse {
  code?: string;
  detail?: string;
  message?: string;
  title?: string;
}

const PROBLEM_TYPE_BASE = 'https://api.example.invalid/problems';

@Catch()
@Injectable()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const problem = this.toProblemDetails(exception, request.requestId);

    this.logFailure(exception, problem, request);
    response.status(problem.status).json(problem);
  }

  // Every failed request is logged so it can be traced from the API console by requestId. The
  // client response is unchanged; the log carries what the response hides (validation
  // messages, the underlying cause and, for server errors, the stack).
  private logFailure(exception: unknown, problem: IProblemDetails, request: RequestWithId): void {
    const context: Record<string, unknown> = {
      event: 'http.request.failed',
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: problem.status,
      code: problem.code,
      detail: problem.detail,
    };
    const validationMessages = this.getValidationMessages(exception);
    if (validationMessages !== undefined) context.validationMessages = validationMessages;

    if (problem.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      context.error = serializeError(exception);
      this.logger.error('HTTP request failed', context);
      return;
    }
    if (exception instanceof Error && exception.cause !== undefined) {
      context.cause = serializeError(exception.cause);
    }
    this.logger.warn('HTTP request failed', context);
  }

  private getValidationMessages(exception: unknown): unknown {
    if (!(exception instanceof HttpException)) return undefined;
    if (exception.getStatus() !== HttpStatus.BAD_REQUEST) return undefined;
    const response = exception.getResponse();
    return typeof response === 'object' && 'message' in response ? response.message : undefined;
  }

  private toProblemDetails(exception: unknown, requestId?: string): IProblemDetails {
    if (this.isMulterFileSizeError(exception)) {
      return this.toProblemDetails(
        new HttpException('The CV file exceeds the maximum allowed size.', HttpStatus.BAD_REQUEST),
        requestId,
      );
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const response =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as IExceptionResponse)
          : undefined;
      const code = response?.code ?? this.getCode(status).toUpperCase();
      const detail = this.getDetail(exceptionResponse, status);

      return {
        type: `${PROBLEM_TYPE_BASE}/${code.toLowerCase().replaceAll('_', '-')}`,
        title: response?.title ?? this.getTitle(status),
        status,
        code,
        detail,
        requestId,
      };
    }

    return {
      type: `${PROBLEM_TYPE_BASE}/internal-server-error`,
      title: 'Internal server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      detail: 'An unexpected error occurred.',
      requestId,
    };
  }

  private isMulterFileSizeError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      exception.code === 'LIMIT_FILE_SIZE'
    );
  }

  private getDetail(response: string | object, status: number): string {
    if (status === HttpStatus.BAD_REQUEST) {
      return 'One or more fields are invalid.';
    }

    if (typeof response === 'string') {
      return response;
    }

    const exceptionResponse = response as IExceptionResponse;
    return exceptionResponse.detail ?? exceptionResponse.message ?? this.getTitle(status);
  }

  private getCode(status: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'validation-error',
      [HttpStatus.UNAUTHORIZED]: 'unauthorized',
      [HttpStatus.FORBIDDEN]: 'forbidden',
      [HttpStatus.NOT_FOUND]: 'not-found',
      [HttpStatus.CONFLICT]: 'conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable-entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'rate-limit-exceeded',
    };

    return codes[status] ?? 'internal-server-error';
  }

  private getTitle(status: number): string {
    const titles: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Validation failed',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
    };

    return titles[status] ?? 'Internal server error';
  }
}
