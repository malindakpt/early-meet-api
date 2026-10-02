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
exports.RequestLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
let RequestLoggingInterceptor = class RequestLoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const startedAt = performance.now();
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                this.logger.log('HTTP request completed', {
                    event: 'http.request.completed',
                    requestId: request.requestId,
                    method: request.method,
                    path: request.originalUrl,
                    statusCode: response.statusCode,
                    durationMs: Math.round(performance.now() - startedAt),
                });
            },
        }));
    }
};
exports.RequestLoggingInterceptor = RequestLoggingInterceptor;
exports.RequestLoggingInterceptor = RequestLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [structured_logger_service_js_1.StructuredLogger])
], RequestLoggingInterceptor);
//# sourceMappingURL=request-logging.interceptor.js.map