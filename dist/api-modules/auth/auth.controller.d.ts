import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import { AuthService, type IAuthUserResponse } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
export declare class AuthController {
    private readonly authService;
    private readonly config;
    constructor(authService: AuthService, config: ConfigService<IEnvironmentVariables, true>);
    register(dto: RegisterDto): Promise<{
        user: IAuthUserResponse;
        verificationRequired: boolean;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        verified: boolean;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        verificationRequired: boolean;
    }>;
    login(dto: LoginDto, response: Response): Promise<{
        user: IAuthUserResponse;
    }>;
    refresh(request: Request, response: Response): Promise<{
        user: IAuthUserResponse;
    }>;
    logout(request: Request, response: Response): Promise<void>;
    me(user: IAuthenticatedUser): Promise<{
        user: IAuthUserResponse;
    }>;
    private getCookie;
    private setAuthenticationCookies;
    private accessCookieOptions;
    private refreshCookieOptions;
}
