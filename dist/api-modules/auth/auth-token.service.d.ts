import { ConfigService } from '@nestjs/config';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import type { IAccessTokenPayload } from './auth.types.js';
export declare class AuthTokenService {
    private readonly config;
    constructor(config: ConfigService<IEnvironmentVariables, true>);
    createAccessToken(user: IAuthenticatedUser): Promise<string>;
    verifyAccessToken(token: string): Promise<IAccessTokenPayload>;
    createOpaqueToken(): string;
    hashOpaqueToken(token: string): string;
    getRefreshTokenExpiration(): Date;
    getVerificationTokenExpiration(): Date;
    private isAccessTokenPayload;
}
