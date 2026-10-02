import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
export declare class ProblemDetailsFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: StructuredLogger);
    catch(exception: unknown, host: ArgumentsHost): void;
    private logFailure;
    private getValidationMessages;
    private toProblemDetails;
    private isMulterFileSizeError;
    private getDetail;
    private getCode;
    private getTitle;
}
