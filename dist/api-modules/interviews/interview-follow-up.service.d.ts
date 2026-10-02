import { type IInterviewFollowUpLlmService } from '../ai/interview-follow-up.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
export interface IInterviewFollowUpResponse {
    followUpQuestion: {
        id: string;
        questionText: string;
        sequence: number;
    } | null;
    reason: string;
    shouldFollowUp: boolean;
}
export declare class InterviewFollowUpService {
    private readonly followUpLlmService;
    private readonly prisma;
    private readonly vacancyCandidateService;
    private readonly logger;
    constructor(followUpLlmService: IInterviewFollowUpLlmService, prisma: PrismaService, vacancyCandidateService: VacancyCandidateService, logger: StructuredLogger);
    decide(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, answerId: string): Promise<IInterviewFollowUpResponse>;
    private findCoreAnswer;
    private toFollowUpInput;
    private continueToNextCoreQuestion;
}
