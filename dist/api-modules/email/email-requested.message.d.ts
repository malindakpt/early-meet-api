export declare const EMAIL_REQUESTED_EVENT_TYPE = "EmailRequested";
export declare const EMAIL_REQUESTED_VERSION = 1;
export interface IInterviewInvitationEmailRequest {
    template: 'interview-invitation';
    templateData: {
        candidateName: string;
        estimatedInterviewTimeSeconds: number;
        interviewUrl: string;
        vacancyTitle: string;
    };
    to: string;
}
export interface IEmailVerificationEmailRequest {
    template: 'email-verification';
    templateData: {
        verificationUrl: string;
    };
    to: string;
}
export type IEmailRequest = IInterviewInvitationEmailRequest | IEmailVerificationEmailRequest;
