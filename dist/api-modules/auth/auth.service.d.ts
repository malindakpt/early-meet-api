import { type User } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AuthTokenService } from './auth-token.service.js';
import { BusinessEmailDomainService } from './business-email-domain.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { PasswordService } from './password.service.js';
import { type IVerificationNotificationService } from './verification-notification.service.js';
export interface IAuthUserResponse {
    email: string;
    emailVerified: boolean;
    id: string;
    name: string;
    organizationId: string;
    role: User['role'];
}
export interface IAuthenticationResult {
    accessToken: string;
    refreshToken: string;
    user: IAuthUserResponse;
}
export declare class AuthService {
    private readonly prisma;
    private readonly domainService;
    private readonly passwordService;
    private readonly tokenService;
    private readonly notificationService;
    constructor(prisma: PrismaService, domainService: BusinessEmailDomainService, passwordService: PasswordService, tokenService: AuthTokenService, notificationService: IVerificationNotificationService);
    register(dto: RegisterDto): Promise<{
        user: IAuthUserResponse;
        verificationRequired: boolean;
    }>;
    verifyEmail(token: string): Promise<{
        verified: boolean;
    }>;
    resendVerification(emailInput: string): Promise<{
        verificationRequired: boolean;
    }>;
    login(dto: LoginDto): Promise<IAuthenticationResult>;
    refresh(refreshToken: string | undefined): Promise<IAuthenticationResult>;
    logout(refreshToken: string | undefined): Promise<void>;
    getAuthenticatedUser(userId: string): Promise<IAuthenticatedUser | null>;
    getMe(userId: string): Promise<IAuthUserResponse>;
    verifyCurrentPassword(userId: string, password: string): Promise<void>;
    private issueAuthentication;
    private toUserResponse;
}
