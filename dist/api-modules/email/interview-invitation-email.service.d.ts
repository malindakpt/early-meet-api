import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
export declare const INTERVIEW_INVITATION_NOTIFICATION_SERVICE: unique symbol;
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
export declare class InterviewInvitationEmailService implements IInterviewInvitationNotificationService {
    private readonly config;
    private readonly transport;
    constructor(config: ConfigService<IEnvironmentVariables, true>, transport: Transporter);
    send(notification: IInterviewInvitationNotification): Promise<void>;
}
