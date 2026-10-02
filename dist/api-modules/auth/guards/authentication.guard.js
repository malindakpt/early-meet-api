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
exports.AuthenticationGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_exception_js_1 = require("../auth.exception.js");
const auth_service_js_1 = require("../auth.service.js");
const auth_token_service_js_1 = require("../auth-token.service.js");
let AuthenticationGuard = class AuthenticationGuard {
    authService;
    tokenService;
    constructor(authService, tokenService) {
        this.authService = authService;
        this.tokenService = tokenService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.getAccessToken(request);
        if (token === undefined) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication is required.');
        }
        try {
            const payload = await this.tokenService.verifyAccessToken(token);
            const user = await this.authService.getAuthenticatedUser(payload.sub);
            if (user === null) {
                throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication is required.');
            }
            request.user = user;
            return true;
        }
        catch (error) {
            if (error instanceof auth_exception_js_1.AuthenticationException) {
                throw error;
            }
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication is required.', { cause: error });
        }
    }
    getAccessToken(request) {
        const authorization = request.headers.authorization;
        if (authorization?.startsWith('Bearer ')) {
            return authorization.slice('Bearer '.length);
        }
        const accessToken = request.cookies?.access_token;
        return typeof accessToken === 'string' ? accessToken : undefined;
    }
};
exports.AuthenticationGuard = AuthenticationGuard;
exports.AuthenticationGuard = AuthenticationGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService,
        auth_token_service_js_1.AuthTokenService])
], AuthenticationGuard);
//# sourceMappingURL=authentication.guard.js.map