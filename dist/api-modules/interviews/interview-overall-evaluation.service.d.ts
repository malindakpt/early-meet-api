import { interviewAssessmentLevelSchema, type IInterviewOverallEvaluation, type IInterviewOverallEvaluationLlmService } from '../ai/interview-overall-evaluation.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
type IAssessmentLevel = ReturnType<typeof interviewAssessmentLevelSchema.parse>;
export interface IInterviewSkillAssessment {
    evidence: string;
    level: IAssessmentLevel;
    technology: string;
    technologySegment: string | null;
    vacancyTechnologyId: string;
}
export interface ICandidateIntelligenceData {
    areasToProbe: IInterviewOverallEvaluation['areasToProbe'];
    competencies: IInterviewOverallEvaluation['competencies'];
    preferredSkills: {
        coverage: number;
        skills: IInterviewSkillAssessment[];
    };
    requiredSkills: {
        coverage: number;
        skills: IInterviewSkillAssessment[];
    };
    strengths: IInterviewOverallEvaluation['strengths'];
}
export interface IInterviewOverallEvaluationResponse {
    candidateIntelligence: ICandidateIntelligenceData;
    evaluatedAt: Date | null;
    interviewId: string;
    overallScore: number;
    summary: string;
}
export declare class InterviewOverallEvaluationService {
    private readonly overallEvaluationLlmService;
    private readonly prisma;
    private readonly vacancyCandidateService;
    private readonly logger;
    constructor(overallEvaluationLlmService: IInterviewOverallEvaluationLlmService, prisma: PrismaService, vacancyCandidateService: VacancyCandidateService, logger: StructuredLogger);
    evaluate(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewOverallEvaluationResponse>;
    evaluateForInterview(interviewId: string): Promise<void>;
    findOne(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, interviewId: string): Promise<IInterviewOverallEvaluationResponse>;
    private evaluateSession;
    private assertReadyForEvaluation;
    private toEvaluationInput;
    private toCandidateIntelligence;
    private toSkillCoverage;
    private toSegmentLabel;
    private calculateOverallScore;
    private findSession;
    private toStoredResponse;
}
export {};
