import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { VERIFICATION_NOTIFICATION_SERVICE } from '../auth/verification-notification.service.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import {
  INTERVIEW_INVITATION_NOTIFICATION_SERVICE,
  InterviewInvitationEmailService,
} from './interview-invitation-email.service.js';
import { SMTP_EMAIL_TRANSPORT, VerificationEmailService } from './verification-email.service.js';

@Module({
  providers: [
    {
      provide: SMTP_EMAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<IEnvironmentVariables, true>) =>
        createTransport({
          host: config.getOrThrow('SMTP_HOST'),
          port: config.getOrThrow('SMTP_PORT'),
          secure: config.getOrThrow('SMTP_PORT') === 465,
          auth: {
            user: config.getOrThrow('SMTP_USERNAME'),
            pass: config.getOrThrow('SMTP_PASSWORD'),
          },
        }),
    },
    VerificationEmailService,
    InterviewInvitationEmailService,
    {
      provide: INTERVIEW_INVITATION_NOTIFICATION_SERVICE,
      useExisting: InterviewInvitationEmailService,
    },
    {
      provide: VERIFICATION_NOTIFICATION_SERVICE,
      useExisting: VerificationEmailService,
    },
  ],
  exports: [INTERVIEW_INVITATION_NOTIFICATION_SERVICE, VERIFICATION_NOTIFICATION_SERVICE],
})
export class EmailModule {}
