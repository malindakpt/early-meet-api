import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import type { IVerificationNotificationService } from '../auth/verification-notification.service.js';
import type { IVerificationNotification } from '../auth/auth.types.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
export declare const SMTP_EMAIL_TRANSPORT: unique symbol;
export declare class VerificationEmailService implements IVerificationNotificationService {
    private readonly config;
    private readonly transport;
    constructor(config: ConfigService<IEnvironmentVariables, true>, transport: Transporter);
    send(notification: IVerificationNotification): Promise<void>;
}
