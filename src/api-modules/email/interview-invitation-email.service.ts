import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';

import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import { SMTP_EMAIL_TRANSPORT } from './verification-email.service.js';

export const INTERVIEW_INVITATION_NOTIFICATION_SERVICE = Symbol(
  'INTERVIEW_INVITATION_NOTIFICATION_SERVICE',
);

export interface IInterviewInvitationNotificationService {
  send(notification: IInterviewInvitationNotification): Promise<void>;
}

export interface IInterviewInvitationNotification {
  candidateEmail: string;
  candidateName: string;
  estimatedInterviewTimeSeconds: number;
  token: string;
  vacancyTitle: string;
}

@Injectable()
export class InterviewInvitationEmailService implements IInterviewInvitationNotificationService {
  constructor(
    private readonly config: ConfigService<IEnvironmentVariables, true>,
    @Inject(SMTP_EMAIL_TRANSPORT) private readonly transport: Transporter,
  ) {}

  async send(notification: IInterviewInvitationNotification): Promise<void> {
    const interviewUrl = new URL(
      `/interview/${encodeURIComponent(notification.token)}`,
      this.config.getOrThrow('INTERVIEW_APP_URL'),
    );
    try {
      await this.transport.sendMail({
        from: this.config.getOrThrow('EMAIL_FROM'),
        to: notification.candidateEmail,
        subject: `Interview Invitation - ${notification.vacancyTitle}`,
        text: `Hello ${notification.candidateName},\n\nYou have been invited to complete an interview for ${notification.vacancyTitle}. Estimated interview time: ${formatEstimatedInterviewTime(notification.estimatedInterviewTimeSeconds)}.\n\nStart your interview: ${interviewUrl.toString()}`,
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException('Unable to send the interview invitation email.', {
        cause: error,
      });
    }
  }
}

function formatEstimatedInterviewTime(seconds: number): string {
  return `about ${Math.max(1, Math.round(seconds / 60))} minute${Math.round(seconds / 60) === 1 ? '' : 's'}`;
}
