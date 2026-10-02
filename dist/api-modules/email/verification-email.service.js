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
exports.VerificationEmailService = exports.SMTP_EMAIL_TRANSPORT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
exports.SMTP_EMAIL_TRANSPORT = Symbol('SMTP_EMAIL_TRANSPORT');
let VerificationEmailService = class VerificationEmailService {
    config;
    transport;
    constructor(config, transport) {
        this.config = config;
        this.transport = transport;
    }
    async send(notification) {
        const verificationUrl = new URL('/verify-email', this.config.getOrThrow('WEB_APP_URL'));
        verificationUrl.searchParams.set('token', notification.token);
        try {
            await this.transport.sendMail({
                from: this.config.getOrThrow('EMAIL_FROM'),
                to: notification.email,
                subject: 'Verify your email address',
                text: `Verify your email address by opening ${verificationUrl.toString()}`,
            });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Unable to send the verification email. ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    }
};
exports.VerificationEmailService = VerificationEmailService;
exports.VerificationEmailService = VerificationEmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(exports.SMTP_EMAIL_TRANSPORT)),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], VerificationEmailService);
//# sourceMappingURL=verification-email.service.js.map