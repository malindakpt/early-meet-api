import type { Request } from 'express';
import type { IAuthenticatedUser } from './authenticated-user.type.js';
import type { RequestWithId } from './http-request.type.js';
export type AuthenticatedRequest = RequestWithId & Request & {
    user: IAuthenticatedUser;
};
