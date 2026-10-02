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
exports.AuthTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const jsonwebtoken_1 = require("jsonwebtoken");
let AuthTokenService = class AuthTokenService {
    config;
    constructor(config) {
        this.config = config;
    }
    async createAccessToken(user) {
        const authSecret = this.config.getOrThrow('AUTH_SECRET');
        return (0, jsonwebtoken_1.sign)({
            sub: user.id,
            organizationId: user.organizationId,
            role: user.role,
        }, authSecret, { algorithm: 'HS256', expiresIn: '15m' });
    }
    async verifyAccessToken(token) {
        const authSecret = this.config.getOrThrow('AUTH_SECRET');
        const decoded = (0, jsonwebtoken_1.verify)(token, authSecret, {
            algorithms: ['HS256'],
        });
        if (!this.isAccessTokenPayload(decoded)) {
            throw new Error('Invalid access token.');
        }
        return decoded;
    }
    createOpaqueToken() {
        return (0, node_crypto_1.randomBytes)(32).toString('base64url');
    }
    hashOpaqueToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    getRefreshTokenExpiration() {
        return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    }
    getVerificationTokenExpiration() {
        return new Date(Date.now() + 1000 * 60 * 60 * 24);
    }
    isAccessTokenPayload(value) {
        if (typeof value !== 'object' || value === null) {
            return false;
        }
        const payload = value;
        return (typeof payload.sub === 'string' &&
            typeof payload.organizationId === 'string' &&
            (payload.role === 'HR' || payload.role === 'PLATFORM_ADMIN') &&
            typeof payload.exp === 'number' &&
            payload.exp > Math.floor(Date.now() / 1000));
    }
};
exports.AuthTokenService = AuthTokenService;
exports.AuthTokenService = AuthTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthTokenService);
//# sourceMappingURL=auth-token.service.js.map