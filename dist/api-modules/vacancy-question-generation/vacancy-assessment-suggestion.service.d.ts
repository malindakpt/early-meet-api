import { ExperienceCompetencyGenerationStage, ExperienceCompetencyGenerationStatus } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type IAssessmentAreaSuggestionLlmService } from '../ai/assessment-area-suggestion.types.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import { VacancyExperienceCompetencyService } from './vacancy-experience-competency.service.js';
export interface IExperienceCompetencyGenerationResponse {
    completedAt: Date | null;
    error: string | null;
    generationId: string;
    message: string;
    progress: number;
    result: string[] | null;
    stage: ExperienceCompetencyGenerationStage;
    startedAt: Date | null;
    status: ExperienceCompetencyGenerationStatus;
}
export declare class VacancyAssessmentSuggestionService {
    private readonly prisma;
    private readonly vacancyService;
    private readonly vacancyExperienceCompetencyService;
    private readonly assessmentAreaSuggestionLlmService;
    private readonly logger;
    constructor(prisma: PrismaService, vacancyService: VacancyService, vacancyExperienceCompetencyService: VacancyExperienceCompetencyService, assessmentAreaSuggestionLlmService: IAssessmentAreaSuggestionLlmService, logger: StructuredLogger);
    start(user: IAuthenticatedUser, vacancyId: string): Promise<IExperienceCompetencyGenerationResponse>;
    findCurrent(user: IAuthenticatedUser, vacancyId: string): Promise<IExperienceCompetencyGenerationResponse | null>;
    process(generationId: string): Promise<void>;
    private findActiveGeneration;
    private normalizeAreas;
    private toResponse;
    private parseResult;
    private isActiveGenerationConflict;
    private errorMessage;
}
