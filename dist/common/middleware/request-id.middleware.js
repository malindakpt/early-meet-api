"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdMiddleware = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
let RequestIdMiddleware = class RequestIdMiddleware {
    use(request, response, next) {
        const providedRequestId = request.header('x-request-id');
        const requestId = providedRequestId !== undefined && REQUEST_ID_PATTERN.test(providedRequestId)
            ? providedRequestId
            : `req_${(0, node_crypto_1.randomUUID)()}`;
        request.requestId = requestId;
        response.setHeader('X-Request-Id', requestId);
        next();
    }
};
exports.RequestIdMiddleware = RequestIdMiddleware;
exports.RequestIdMiddleware = RequestIdMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestIdMiddleware);
//# sourceMappingURL=request-id.middleware.js.map