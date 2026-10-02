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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_js_1 = require("./auth.service.js");
const current_user_decorator_js_1 = require("./decorators/current-user.decorator.js");
const login_dto_js_1 = require("./dto/login.dto.js");
const register_dto_js_1 = require("./dto/register.dto.js");
const resend_verification_dto_js_1 = require("./dto/resend-verification.dto.js");
const verify_email_dto_js_1 = require("./dto/verify-email.dto.js");
const authentication_guard_js_1 = require("./guards/authentication.guard.js");
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
let AuthController = class AuthController {
    authService;
    config;
    constructor(authService, config) {
        this.authService = authService;
        this.config = config;
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async verifyEmail(dto) {
        return this.authService.verifyEmail(dto.token);
    }
    async resendVerification(dto) {
        return this.authService.resendVerification(dto.email);
    }
    async login(dto, response) {
        const result = await this.authService.login(dto);
        this.setAuthenticationCookies(response, result);
        return { user: result.user };
    }
    async refresh(request, response) {
        const result = await this.authService.refresh(this.getCookie(request, REFRESH_COOKIE));
        this.setAuthenticationCookies(response, result);
        return { user: result.user };
    }
    async logout(request, response) {
        await this.authService.logout(this.getCookie(request, REFRESH_COOKIE));
        response.clearCookie(ACCESS_COOKIE, this.accessCookieOptions());
        response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
    }
    async me(user) {
        return { user: await this.authService.getMe(user.id) };
    }
    getCookie(request, name) {
        const value = request.cookies?.[name];
        return typeof value === 'string' ? value : undefined;
    }
    setAuthenticationCookies(response, result) {
        response.cookie(ACCESS_COOKIE, result.accessToken, {
            ...this.accessCookieOptions(),
            maxAge: 1000 * 60 * 15,
        });
        response.cookie(REFRESH_COOKIE, result.refreshToken, {
            ...this.refreshCookieOptions(),
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
    }
    accessCookieOptions() {
        return {
            httpOnly: true,
            secure: this.config.getOrThrow('NODE_ENV') === 'production',
            sameSite: 'lax',
            path: '/api/v1',
        };
    }
    refreshCookieOptions() {
        return {
            ...this.accessCookieOptions(),
            path: '/api/v1/auth',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_js_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_email_dto_js_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(202),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resend_verification_dto_js_1.ResendVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_js_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map