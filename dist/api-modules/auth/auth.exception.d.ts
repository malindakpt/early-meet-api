import { HttpException, type HttpStatus } from '@nestjs/common';
export declare class AuthenticationException extends HttpException {
    readonly code: string;
    constructor(status: HttpStatus, code: string, detail: string, options?: {
        cause?: unknown;
    });
}
