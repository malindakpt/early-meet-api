import { InterviewEvaluationStatus, InterviewQuestionStatus, InterviewSessionStatus, InvitationStatus, type Prisma } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { AuthTokenService } from '../auth/auth-token.service.js';
import { type IInterviewInvitationNotificationService } from '../email/interview-invitation-email.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
import type { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import type { UpdateInterviewInvitationDto } from './dto/update-interview-invitation.dto.js';
import { InterviewEvaluationScheduler } from './interview-evaluation-scheduler.service.js';
declare const invitationInclude: {
    readonly candidate: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly email: true;
            readonly phone: true;
            readonly status: true;
        };
    };
    readonly vacancy: {
        readonly select: {
            readonly id: true;
            readonly title: true;
            readonly status: true;
        };
    };
};
type IInterviewInvitationRecord = Prisma.InterviewInvitationGetPayload<{
    include: typeof invitationInclude;
}>;
export type IInterviewResponse = Omit<IInterviewInvitationRecord, 'tokenHash'>;
export interface ICreatedInterviewResponse extends IInterviewResponse {
    token: string;
}
export interface IInterviewQuestionResponse {
    id: string;
    questionText: string;
    sequence: number;
}
export interface IInterviewProgressResponse {
    answeredQuestionCount: number;
    currentQuestion: IInterviewQuestionResponse | null;
    interviewId: string;
    isComplete: boolean;
    sessionId: string;
    status: InterviewSessionStatus;
    totalCoreQuestionCount: number;
}
export interface ICandidateInterviewProgressResponse {
    answeredQuestionCount: number;
    currentQuestion: IInterviewQuestionResponse | null;
    estimatedInterviewTimeSeconds: number;
    isComplete: boolean;
    status: InterviewSessionStatus;
    totalCoreQuestionCount: number;
    vacancyTitle: string;
}
export interface IInterviewReviewQuestionResponse {
    answerText: string | null;
    explanation: string | null;
    followUpFromId: string | null;
    id: string;
    questionText: string;
    score: number | null;
    sequence: number;
    status: InterviewQuestionStatus;
}
export interface IInterviewReviewListItem {
    candidate: {
        email: string;
        name: string;
    };
    completedAt: Date | null;
    createdAt: Date;
    id: string;
    overallScore: number | null;
    sentAt: Date | null;
    status: InvitationStatus;
    vacancy: {
        id: string;
        title: string;
    };
    vacancyCandidateId: string;
}
export interface IInterviewReviewDetailResponse extends IInterviewReviewListItem {
    evaluation: {
        candidateIntelligence: Prisma.JsonValue;
        evaluatedAt: Date;
        overallScore: number;
        summary: string;
    } | null;
    evaluationStatus: InterviewEvaluationStatus | null;
    questions: IInterviewReviewQuestionResponse[];
    sessionStatus: InterviewSessionStatus | null;
    startedAt: Date | null;
}
export declare class InterviewService {
    private readonly prisma;
    private readonly vacancyCandidateService;
    private readonly authTokenService;
    private readonly invitationNotificationService;
    private readonly interviewEvaluationScheduler?;
    constructor(prisma: PrismaService, vacancyCandidateService: VacancyCandidateService, authTokenService: AuthTokenService, invitationNotificationService: IInterviewInvitationNotificationService, interviewEvaluationScheduler?: InterviewEvaluationScheduler | undefined);
    create(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<ICreatedInterviewResponse>;
    sendInvitation(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IInterviewResponse>;
    findAll(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IInterviewResponse[]>;
    findAllForReview(user: IAuthenticatedUser): Promise<IInterviewReviewListItem[]>;
    findOneForReview(user: IAuthenticatedUser, interviewId: string): Promise<IInterviewReviewDetailResponse>;
    removeForReview(user: IAuthenticatedUser, interviewId: string): Promise<void>;
    findOne(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewResponse>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, dto: UpdateInterviewInvitationDto): Promise<IInterviewResponse>;
    start(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewProgressResponse>;
    getCandidateProgress(token: string): Promise<ICandidateInterviewProgressResponse>;
    startCandidateInterview(token: string): Promise<ICandidateInterviewProgressResponse>;
    submitCandidateAnswer(token: string, dto: SubmitInterviewAnswerDto): Promise<ICandidateInterviewProgressResponse>;
    private startInvitation;
    getProgress(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewProgressResponse>;
    submitAnswer(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, dto: SubmitInterviewAnswerDto): Promise<IInterviewProgressResponse>;
    private submitAnswerForInvitation;
    private findCandidateInvitation;
    private findInvitation;
    private findSession;
    private toProgress;
    private toReviewListItem;
    private toCandidateProgress;
    private toCandidateProgressFromProgress;
    private getEstimatedInterviewTimeSeconds;
    private toResponse;
}
export {};
