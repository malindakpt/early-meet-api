import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { AuthTokenService } from '../auth-token.service.js';
export declare class AuthenticationGuard implements CanActivate {
    private readonly authService;
    private readonly tokenService;
    constructor(authService: AuthService, tokenService: AuthTokenService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getAccessToken;
}
