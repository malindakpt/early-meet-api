"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemDetailsFilter = void 0;
const common_1 = require("@nestjs/common");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const PROBLEM_TYPE_BASE = 'https://api.example.invalid/problems';
let ProblemDetailsFilter = class ProblemDetailsFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const http = host.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const problem = this.toProblemDetails(exception, request.requestId);
        this.logFailure(exception, problem, request);
        response.status(problem.status).json(problem);
    }
    // Every failed request is logged so it can be traced from the API console by requestId. The
    // client response is unchanged; the log carries what the response hides (validation
    // messages, the underlying cause and, for server errors, the stack).
    logFailure(exception, problem, request) {
        const context = {
            event: 'http.request.failed',
            requestId: request.requestId,
            method: request.method,
            path: request.originalUrl,
            statusCode: problem.status,
            code: problem.code,
            detail: problem.detail,
        };
        const validationMessages = this.getValidationMessages(exception);
        if (validationMessages !== undefined)
            context.validationMessages = validationMessages;
        if (problem.status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            context.error = (0, error_serializer_js_1.serializeError)(exception);
            this.logger.error('HTTP request failed', context);
            return;
        }
        if (exception instanceof Error && exception.cause !== undefined) {
            context.cause = (0, error_serializer_js_1.serializeError)(exception.cause);
        }
        this.logger.warn('HTTP request failed', context);
    }
    getValidationMessages(exception) {
        if (!(exception instanceof common_1.HttpException))
            return undefined;
        if (exception.getStatus() !== common_1.HttpStatus.BAD_REQUEST)
            return undefined;
        const response = exception.getResponse();
        return typeof response === 'object' && 'message' in response ? response.message : undefined;
    }
    toProblemDetails(exception, requestId) {
        if (this.isMulterFileSizeError(exception)) {
            return this.toProblemDetails(new common_1.HttpException('The CV file exceeds the maximum allowed size.', common_1.HttpStatus.BAD_REQUEST), requestId);
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const response = typeof exceptionResponse === 'object'
                ? exceptionResponse
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
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_SERVER_ERROR',
            detail: 'An unexpected error occurred.',
            requestId,
        };
    }
    isMulterFileSizeError(exception) {
        return (typeof exception === 'object' &&
            exception !== null &&
            'code' in exception &&
            exception.code === 'LIMIT_FILE_SIZE');
    }
    getDetail(response, status) {
        if (status === common_1.HttpStatus.BAD_REQUEST) {
            return 'One or more fields are invalid.';
        }
        if (typeof response === 'string') {
            return response;
        }
        const exceptionResponse = response;
        return exceptionResponse.detail ?? exceptionResponse.message ?? this.getTitle(status);
    }
    getCode(status) {
        const codes = {
            [common_1.HttpStatus.BAD_REQUEST]: 'validation-error',
            [common_1.HttpStatus.UNAUTHORIZED]: 'unauthorized',
            [common_1.HttpStatus.FORBIDDEN]: 'forbidden',
            [common_1.HttpStatus.NOT_FOUND]: 'not-found',
            [common_1.HttpStatus.CONFLICT]: 'conflict',
            [common_1.HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable-entity',
            [common_1.HttpStatus.TOO_MANY_REQUESTS]: 'rate-limit-exceeded',
        };
        return codes[status] ?? 'internal-server-error';
    }
    getTitle(status) {
        const titles = {
            [common_1.HttpStatus.BAD_REQUEST]: 'Validation failed',
            [common_1.HttpStatus.UNAUTHORIZED]: 'Unauthorized',
            [common_1.HttpStatus.FORBIDDEN]: 'Forbidden',
            [common_1.HttpStatus.NOT_FOUND]: 'Not found',
            [common_1.HttpStatus.CONFLICT]: 'Conflict',
            [common_1.HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable entity',
            [common_1.HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
        };
        return titles[status] ?? 'Internal server error';
    }
};
exports.ProblemDetailsFilter = ProblemDetailsFilter;
exports.ProblemDetailsFilter = ProblemDetailsFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [structured_logger_service_js_1.StructuredLogger])
], ProblemDetailsFilter);
//# sourceMappingURL=problem-details.filter.js.map