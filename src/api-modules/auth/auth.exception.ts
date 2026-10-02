import { HttpException, type HttpStatus } from '@nestjs/common';

export class AuthenticationException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    detail: string,
    options?: { cause?: unknown },
  ) {
    super({ code, detail }, status, options);
  }
}
