import type { IVerificationNotification } from './auth.types.js';

export const VERIFICATION_NOTIFICATION_SERVICE = Symbol('VERIFICATION_NOTIFICATION_SERVICE');

export interface IVerificationNotificationService {
  send(notification: IVerificationNotification): Promise<void>;
}
