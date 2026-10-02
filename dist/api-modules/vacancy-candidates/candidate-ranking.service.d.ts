import { InterviewEvaluationStatus, InterviewSessionStatus } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { CandidateRankingQueryDto } from './dto/candidate-ranking-query.dto.js';
export interface ICandidateQuestionScore {
    questionId: string | null;
    questionText: string;
    score: number;
    sequence: number;
}
export interface ICandidateTechnologyScore {
    technology: string;
    averageScore: number;
    evaluatedCoreQuestionCount: number;
}
export interface IRankedCandidate {
    candidate: {
        id: string;
        email: string;
        name: string;
    };
    candidateId: string;
    coreQuestionCount: number;
    evaluatedCoreAnswerCount: number;
    interviewId: string;
    interviewStatus: InterviewSessionStatus;
    overallScore: number;
    preferredSkillCoverage: number | null;
    questionScores: ICandidateQuestionScore[];
    rank: number;
    requiredSkillCoverage: number | null;
    technologyScores: ICandidateTechnologyScore[];
    vacancyCandidateId: string;
}
export interface INotEvaluatedCandidate {
    evaluationStatus: InterviewEvaluationStatus | null;
    candidate: {
        id: string;
        email: string;
        name: string;
    };
    candidateId: string;
    interviewId: string | null;
    interviewStatus: InterviewSessionStatus | null;
    reason: 'EVALUATION_FAILED' | 'INTERVIEW_INCOMPLETE' | 'INTERVIEW_NOT_STARTED' | 'OVERALL_EVALUATION_PENDING';
    vacancyCandidateId: string;
}
export interface ICandidateRankingResponse {
    notEvaluatedCandidates: INotEvaluatedCandidate[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    };
    rankedCandidates: IRankedCandidate[];
}
export declare class CandidateRankingService {
    private readonly prisma;
    private readonly vacancyService;
    constructor(prisma: PrismaService, vacancyService: VacancyService);
    findAll(user: IAuthenticatedUser, vacancyId: string, query: CandidateRankingQueryDto): Promise<ICandidateRankingResponse>;
    private findLatestEvaluation;
    private toRankedCandidate;
    private toNotEvaluatedCandidate;
    private toTechnologyScores;
    private assignCompetitionRanks;
    private getPersistedCoverage;
}
