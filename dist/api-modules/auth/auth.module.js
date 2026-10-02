"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_js_1 = require("./auth.controller.js");
const auth_service_js_1 = require("./auth.service.js");
const auth_token_service_js_1 = require("./auth-token.service.js");
const business_email_domain_service_js_1 = require("./business-email-domain.service.js");
const authentication_guard_js_1 = require("./guards/authentication.guard.js");
const platform_admin_guard_js_1 = require("./guards/platform-admin.guard.js");
const password_service_js_1 = require("./password.service.js");
const email_module_js_1 = require("../email/email.module.js");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [email_module_js_1.EmailModule],
        controllers: [auth_controller_js_1.AuthController],
        providers: [
            auth_service_js_1.AuthService,
            auth_token_service_js_1.AuthTokenService,
            authentication_guard_js_1.AuthenticationGuard,
            platform_admin_guard_js_1.PlatformAdminGuard,
            business_email_domain_service_js_1.BusinessEmailDomainService,
            password_service_js_1.PasswordService,
        ],
        exports: [auth_service_js_1.AuthService, auth_token_service_js_1.AuthTokenService, authentication_guard_js_1.AuthenticationGuard, platform_admin_guard_js_1.PlatformAdminGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map