import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';

import type { IVerificationNotificationService } from '../auth/verification-notification.service.js';
import type { IVerificationNotification } from '../auth/auth.types.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';

export const SMTP_EMAIL_TRANSPORT = Symbol('SMTP_EMAIL_TRANSPORT');

@Injectable()
export class VerificationEmailService implements IVerificationNotificationService {
  constructor(
    private readonly config: ConfigService<IEnvironmentVariables, true>,
    @Inject(SMTP_EMAIL_TRANSPORT) private readonly transport: Transporter,
  ) {}

  async send(notification: IVerificationNotification): Promise<void> {
    const verificationUrl = new URL('/verify-email', this.config.getOrThrow('WEB_APP_URL'));
    verificationUrl.searchParams.set('token', notification.token);

    try {
      await this.transport.sendMail({
        from: this.config.getOrThrow('EMAIL_FROM'),
        to: notification.email,
        subject: 'Verify your email address',
        text: `Verify your email address by opening ${verificationUrl.toString()}`,
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Unable to send the verification email. ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}
