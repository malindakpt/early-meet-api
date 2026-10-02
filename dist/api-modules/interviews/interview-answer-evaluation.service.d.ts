import { type IInterviewAnswerEvaluationLlmService } from '../ai/interview-answer-evaluation.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
export interface IInterviewAnswerEvaluationResponse {
    answerId: string;
    explanation: string;
    score: number;
}
export declare class InterviewAnswerEvaluationService {
    private readonly evaluationLlmService;
    private readonly prisma;
    private readonly vacancyCandidateService;
    private readonly logger;
    constructor(evaluationLlmService: IInterviewAnswerEvaluationLlmService, prisma: PrismaService, vacancyCandidateService: VacancyCandidateService, logger: StructuredLogger);
    evaluate(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string, answerId: string): Promise<IInterviewAnswerEvaluationResponse>;
    private findAnsweredAnswer;
    private toEvaluationInput;
}
