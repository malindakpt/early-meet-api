"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessEmailDomainService = void 0;
const common_1 = require("@nestjs/common");
const PERSONAL_EMAIL_DOMAINS = new Set([
    'aol.com',
    'gmail.com',
    'gmx.com',
    'hotmail.com',
    'icloud.com',
    'live.com',
    'mail.com',
    'outlook.com',
    'proton.me',
    'protonmail.com',
    'yahoo.com',
]);
let BusinessEmailDomainService = class BusinessEmailDomainService {
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    getDomain(email) {
        return this.normalizeEmail(email).split('@')[1] ?? '';
    }
    isPersonalDomain(domain) {
        return PERSONAL_EMAIL_DOMAINS.has(domain.toLowerCase());
    }
};
exports.BusinessEmailDomainService = BusinessEmailDomainService;
exports.BusinessEmailDomainService = BusinessEmailDomainService = __decorate([
    (0, common_1.Injectable)()
], BusinessEmailDomainService);
//# sourceMappingURL=business-email-domain.service.js.map