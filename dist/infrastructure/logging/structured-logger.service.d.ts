import { type LoggerService } from '@nestjs/common';
export declare class StructuredLogger implements LoggerService {
    log(message: unknown, ...optionalParams: unknown[]): void;
    error(message: unknown, ...optionalParams: unknown[]): void;
    warn(message: unknown, ...optionalParams: unknown[]): void;
    debug(message: unknown, ...optionalParams: unknown[]): void;
    verbose(message: unknown, ...optionalParams: unknown[]): void;
    fatal(message: unknown, ...optionalParams: unknown[]): void;
    private write;
}
