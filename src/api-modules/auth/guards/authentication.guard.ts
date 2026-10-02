import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';
import { AuthenticationException } from '../auth.exception.js';
import { AuthService } from '../auth.service.js';
import { AuthTokenService } from '../auth-token.service.js';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: AuthTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.getAccessToken(request);
    if (token === undefined) {
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Authentication is required.',
      );
    }
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      const user = await this.authService.getAuthenticatedUser(payload.sub);
      if (user === null) {
        throw new AuthenticationException(
          HttpStatus.UNAUTHORIZED,
          'UNAUTHORIZED',
          'Authentication is required.',
        );
      }
      request.user = user;
      return true;
    } catch (error: unknown) {
      if (error instanceof AuthenticationException) {
        throw error;
      }
      throw new AuthenticationException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Authentication is required.',
        { cause: error },
      );
    }
  }

  private getAccessToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }
    const accessToken = request.cookies?.access_token;
    return typeof accessToken === 'string' ? accessToken : undefined;
  }
}
