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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const auth_exception_js_1 = require("./auth.exception.js");
const auth_token_service_js_1 = require("./auth-token.service.js");
const business_email_domain_service_js_1 = require("./business-email-domain.service.js");
const password_service_js_1 = require("./password.service.js");
const verification_notification_service_js_1 = require("./verification-notification.service.js");
let AuthService = class AuthService {
    prisma;
    domainService;
    passwordService;
    tokenService;
    notificationService;
    constructor(prisma, domainService, passwordService, tokenService, notificationService) {
        this.prisma = prisma;
        this.domainService = domainService;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.notificationService = notificationService;
    }
    async register(dto) {
        const email = this.domainService.normalizeEmail(dto.email);
        const domain = this.domainService.getDomain(email);
        if (this.domainService.isPersonalDomain(domain)) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'PERSONAL_EMAIL_NOT_ALLOWED', 'A company or business email address is required.');
        }
        const verificationToken = this.tokenService.createOpaqueToken();
        const passwordHash = await this.passwordService.hash(dto.password);
        try {
            const user = await this.prisma.$transaction(async (transaction) => {
                // The domain is a stable organization identity, so later registrations cannot rename it.
                const organization = await transaction.organization.upsert({
                    where: { emailDomain: domain },
                    create: { name: dto.organizationName, emailDomain: domain, status: 'ACTIVE' },
                    update: {},
                });
                return transaction.user.create({
                    data: {
                        name: dto.name,
                        email,
                        role: 'HR',
                        emailVerified: false,
                        status: 'ACTIVE',
                        organizationId: organization.id,
                        credentials: {
                            create: {
                                passwordHash,
                                verificationTokenHash: this.tokenService.hashOpaqueToken(verificationToken),
                                verificationTokenExpiresAt: this.tokenService.getVerificationTokenExpiration(),
                            },
                        },
                    },
                });
            });
            await this.notificationService.send({ email, token: verificationToken });
            return { user: this.toUserResponse(user), verificationRequired: true };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.CONFLICT, 'EMAIL_ALREADY_REGISTERED', 'An account with this email address already exists.');
            }
            throw error;
        }
    }
    async verifyEmail(token) {
        const credentials = await this.prisma.userCredentials.findUnique({
            where: { verificationTokenHash: this.tokenService.hashOpaqueToken(token) },
            include: { user: true },
        });
        if (credentials === null) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'INVALID_VERIFICATION_TOKEN', 'The verification token is invalid.');
        }
        if (credentials.user.emailVerified) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.CONFLICT, 'EMAIL_ALREADY_VERIFIED', 'This email address is already verified.');
        }
        if (credentials.verificationTokenExpiresAt === null ||
            credentials.verificationTokenExpiresAt <= new Date()) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'VERIFICATION_TOKEN_EXPIRED', 'The verification token has expired.');
        }
        await this.prisma.user.update({
            where: { id: credentials.userId },
            data: { emailVerified: true },
        });
        await this.prisma.userCredentials.update({
            where: { id: credentials.id },
            data: { verificationTokenExpiresAt: null },
        });
        return { verified: true };
    }
    async resendVerification(emailInput) {
        const email = this.domainService.normalizeEmail(emailInput);
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { credentials: true },
        });
        if (user === null || user.emailVerified || user.credentials === null) {
            return { verificationRequired: true };
        }
        const token = this.tokenService.createOpaqueToken();
        await this.prisma.userCredentials.update({
            where: { id: user.credentials.id },
            data: {
                verificationTokenHash: this.tokenService.hashOpaqueToken(token),
                verificationTokenExpiresAt: this.tokenService.getVerificationTokenExpiration(),
            },
        });
        await this.notificationService.send({ email: user.email, token });
        return { verificationRequired: true };
    }
    async login(dto) {
        const email = this.domainService.normalizeEmail(dto.email);
        // Domain policy is onboarding-only so existing verified accounts are not locked out by later policy changes.
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { credentials: true },
        });
        if (user === null ||
            user.credentials === null ||
            !(await this.passwordService.verify(dto.password, user.credentials.passwordHash))) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.FORBIDDEN, 'ACCOUNT_DISABLED', 'This account is not active.');
        }
        if (!user.emailVerified) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.FORBIDDEN, 'EMAIL_NOT_VERIFIED', 'Verify your email address before signing in.');
        }
        return this.issueAuthentication(user);
    }
    async refresh(refreshToken) {
        if (refreshToken === undefined) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid.');
        }
        const credentials = await this.prisma.userCredentials.findUnique({
            where: { refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken) },
            include: { user: true },
        });
        if (credentials === null ||
            credentials.refreshTokenExpiresAt === null ||
            credentials.refreshTokenExpiresAt <= new Date() ||
            credentials.user.status !== client_1.UserStatus.ACTIVE ||
            !credentials.user.emailVerified) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid.');
        }
        return this.issueAuthentication({ ...credentials.user, credentials });
    }
    async logout(refreshToken) {
        if (refreshToken !== undefined) {
            await this.prisma.userCredentials.updateMany({
                where: { refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken) },
                data: { refreshTokenHash: null, refreshTokenExpiresAt: null },
            });
        }
    }
    async getAuthenticatedUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user === null || user.status !== client_1.UserStatus.ACTIVE || !user.emailVerified) {
            return null;
        }
        return { id: user.id, organizationId: user.organizationId, role: user.role };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user === null) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication is required.');
        }
        return this.toUserResponse(user);
    }
    async verifyCurrentPassword(userId, password) {
        const credentials = await this.prisma.userCredentials.findUnique({ where: { userId } });
        if (credentials === null ||
            !(await this.passwordService.verify(password, credentials.passwordHash))) {
            throw new auth_exception_js_1.AuthenticationException(common_1.HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Incorrect password.');
        }
    }
    async issueAuthentication(user) {
        const refreshToken = this.tokenService.createOpaqueToken();
        await this.prisma.userCredentials.update({
            where: { userId: user.id },
            data: {
                refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken),
                refreshTokenExpiresAt: this.tokenService.getRefreshTokenExpiration(),
            },
        });
        const identity = {
            id: user.id,
            organizationId: user.organizationId,
            role: user.role,
        };
        return {
            accessToken: await this.tokenService.createAccessToken(identity),
            refreshToken,
            user: this.toUserResponse(user),
        };
    }
    toUserResponse(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            organizationId: user.organizationId,
            role: user.role,
            emailVerified: user.emailVerified,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(verification_notification_service_js_1.VERIFICATION_NOTIFICATION_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        business_email_domain_service_js_1.BusinessEmailDomainService,
        password_service_js_1.PasswordService,
        auth_token_service_js_1.AuthTokenService, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map