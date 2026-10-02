import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';
import type { IAuthenticatedUser } from '../../../common/types/authenticated-user.type.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthenticatedUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
