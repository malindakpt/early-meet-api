import type { IVerificationNotification } from './auth.types.js';
export declare const VERIFICATION_NOTIFICATION_SERVICE: unique symbol;
export interface IVerificationNotificationService {
    send(notification: IVerificationNotification): Promise<void>;
}
