import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';

export interface IAccessTokenPayload extends IAuthenticatedUser {
  sub: string;
}

export interface IVerificationNotification {
  email: string;
  token: string;
}
