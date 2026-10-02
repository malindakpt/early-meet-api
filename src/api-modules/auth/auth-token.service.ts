import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { sign, verify } from 'jsonwebtoken';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import type { IAccessTokenPayload } from './auth.types.js';

@Injectable()
export class AuthTokenService {
  constructor(private readonly config: ConfigService<IEnvironmentVariables, true>) {}

  async createAccessToken(user: IAuthenticatedUser): Promise<string> {
    const authSecret = this.config.getOrThrow<string>('AUTH_SECRET');
    return sign(
      {
        sub: user.id,
        organizationId: user.organizationId,
        role: user.role,
      },
      authSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );
  }

  async verifyAccessToken(token: string): Promise<IAccessTokenPayload> {
    const authSecret = this.config.getOrThrow<string>('AUTH_SECRET');
    const decoded = verify(token, authSecret, {
      algorithms: ['HS256'],
    });
    if (!this.isAccessTokenPayload(decoded)) {
      throw new Error('Invalid access token.');
    }
    return decoded;
  }

  createOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getRefreshTokenExpiration(): Date {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  }

  getVerificationTokenExpiration(): Date {
    return new Date(Date.now() + 1000 * 60 * 60 * 24);
  }

  private isAccessTokenPayload(value: unknown): value is IAccessTokenPayload {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const payload = value as Record<string, unknown>;
    return (
      typeof payload.sub === 'string' &&
      typeof payload.organizationId === 'string' &&
      (payload.role === 'HR' || payload.role === 'PLATFORM_ADMIN') &&
      typeof payload.exp === 'number' &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  }
}
