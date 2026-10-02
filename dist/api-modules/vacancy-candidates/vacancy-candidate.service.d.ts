import { Prisma } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CandidateService } from '../candidates/candidate.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { CreateVacancyCandidateDto } from './dto/create-vacancy-candidate.dto.js';
import type { UploadCandidateCvsDto } from './dto/upload-candidate-cvs.dto.js';
import type { SubmitPublicApplicationDto } from './dto/submit-public-application.dto.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { type IExtractedCvData } from '../ai/cv-extraction.types.js';
import { type VacancyCandidateListQueryDto } from './dto/vacancy-candidate-list-query.dto.js';
declare const candidateInclude: (vacancyId: string) => {
    readonly candidate: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly email: true;
            readonly phone: true;
            readonly status: true;
            readonly processingStatus: true;
            readonly cvFileName: true;
            readonly cvProcessingError: true;
            readonly invitations: {
                readonly where: {
                    readonly vacancyId: string;
                };
                readonly orderBy: {
                    readonly createdAt: "desc";
                };
                readonly select: {
                    readonly createdAt: true;
                    readonly expiresAt: true;
                    readonly id: true;
                    readonly sentAt: true;
                    readonly status: true;
                };
                readonly take: 1;
            };
            readonly sessions: {
                readonly where: {
                    readonly vacancyId: string;
                };
                readonly orderBy: {
                    readonly createdAt: "desc";
                };
                readonly select: {
                    readonly evaluationStatus: true;
                    readonly evaluatedAt: true;
                    readonly invitationId: true;
                    readonly overallScore: true;
                    readonly status: true;
                };
                readonly take: 1;
            };
        };
    };
};
type IVacancyCandidateRecord = Prisma.VacancyCandidateGetPayload<{
    include: ReturnType<typeof candidateInclude>;
}>;
export type IVacancyCandidateResponse = IVacancyCandidateRecord;
export interface ICvIngestResult {
    candidateId?: string;
    fileName: string;
    message?: string;
    status: 'CREATED' | 'DUPLICATE';
}
export interface IAiMatchResult {
    extractedData: IExtractedCvData;
    gaps: string[];
    preferredTechnologiesMet: string[];
    requiredTechnologiesMet: string[];
    score: number;
    strengths: string[];
    summary: string;
    vacancyMatchScore: number;
}
export interface IVacancyCandidateListResponse {
    items: IVacancyCandidateResponse[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    };
}
export declare class VacancyCandidateService {
    private readonly prisma;
    private readonly vacancyService;
    private readonly candidateService;
    private readonly vacancyTechnologyService;
    constructor(prisma: PrismaService, vacancyService: VacancyService, candidateService: CandidateService, vacancyTechnologyService: VacancyTechnologyService);
    uploadCvs(user: IAuthenticatedUser, vacancyId: string, dto: UploadCandidateCvsDto): Promise<{
        items: ICvIngestResult[];
    }>;
    submitPublicApplication(token: string, dto: SubmitPublicApplicationDto): Promise<void>;
    private ingestCv;
    retryCvProcessing(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IVacancyCandidateResponse>;
    queueAiMatches(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateIds: string[]): Promise<string[]>;
    claimAiMatch(vacancyCandidateId: string): Promise<boolean>;
    completeAiMatch(vacancyCandidateId: string, result: IAiMatchResult): Promise<void>;
    private findAvailableExtractedEmail;
    failAiMatch(vacancyCandidateId: string): Promise<void>;
    getPersistedCvExtractedData(vacancyCandidateId: string): Promise<IExtractedCvData>;
    getCvTextForAiMatch(vacancyCandidateId: string): Promise<string>;
    create(user: IAuthenticatedUser, vacancyId: string, dto: CreateVacancyCandidateDto): Promise<IVacancyCandidateResponse>;
    findAll(user: IAuthenticatedUser, vacancyId: string, query: VacancyCandidateListQueryDto): Promise<IVacancyCandidateListResponse>;
    findOne(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IVacancyCandidateResponse>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string, dto: Prisma.VacancyCandidateUpdateInput): Promise<IVacancyCandidateResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<void>;
    private findAssociation;
    private deleteInterviewData;
    private toFileName;
    private rethrowDuplicateAssociation;
    private toListWhere;
    private toListOrderBy;
    private sortByInterviewScore;
    private getCompletedInterviewScore;
    private validateScoreRange;
    private toResponse;
}
export declare function toUploadTimestampName(uploadedAt: Date): string;
export {};
