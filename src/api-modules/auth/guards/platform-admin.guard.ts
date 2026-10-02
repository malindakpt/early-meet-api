import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Platform administrator access is required.');
    }
    return true;
  }
}
