"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyAssessmentSuggestionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const assessment_area_suggestion_types_js_1 = require("../ai/assessment-area-suggestion.types.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const vacancy_experience_competency_service_js_1 = require("./vacancy-experience-competency.service.js");
const stageDetails = {
    PREPARING: { message: 'Preparing job information...', progress: 0 },
    ANALYZING_JOB: { message: 'Analyzing the job description...', progress: 25 },
    IDENTIFYING_FOCUS_AREAS: { message: 'Identifying experience areas...', progress: 50 },
    GENERATING_PLAN: { message: 'Generating experience questions...', progress: 75 },
    VALIDATING_RESULT: { message: 'Validating experience areas...', progress: 75 },
    SAVING_RESULT: { message: 'Saving experience areas...', progress: 75 },
    GENERATING_QUESTIONS: { message: 'Generating experience questions...', progress: 75 },
    VALIDATING_QUESTIONS: { message: 'Validating experience areas...', progress: 75 },
    FINALIZING_PLAN: { message: 'Saving experience areas...', progress: 75 },
    SAVING_AREAS: { message: 'Saving experience areas...', progress: 75 },
    COMPLETED: { message: 'Experience areas are ready.', progress: 100 },
};
let VacancyAssessmentSuggestionService = class VacancyAssessmentSuggestionService {
    prisma;
    vacancyService;
    vacancyExperienceCompetencyService;
    assessmentAreaSuggestionLlmService;
    logger;
    constructor(prisma, vacancyService, vacancyExperienceCompetencyService, assessmentAreaSuggestionLlmService, logger) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
        this.vacancyExperienceCompetencyService = vacancyExperienceCompetencyService;
        this.assessmentAreaSuggestionLlmService = assessmentAreaSuggestionLlmService;
        this.logger = logger;
    }
    async start(user, vacancyId) {
        const vacancy = await this.vacancyService.findOne(user, vacancyId);
        if (vacancy.jobDescription.trim().length < 30) {
            throw new common_1.UnprocessableEntityException('Add a more detailed job description before requesting suggestions.');
        }
        const active = await this.findActiveGeneration(vacancyId);
        if (active !== null)
            return this.toResponse(active);
        try {
            const generation = await this.prisma.experienceCompetencyGeneration.create({
                data: {
                    vacancyId,
                    status: client_1.ExperienceCompetencyGenerationStatus.QUEUED,
                    stage: client_1.ExperienceCompetencyGenerationStage.PREPARING,
                    ...stageDetails.PREPARING,
                },
            });
            return this.toResponse(generation);
        }
        catch (error) {
            if (!this.isActiveGenerationConflict(error))
                throw error;
            const concurrentGeneration = await this.findActiveGeneration(vacancyId);
            if (concurrentGeneration === null)
                throw error;
            return this.toResponse(concurrentGeneration);
        }
    }
    async findCurrent(user, vacancyId) {
        await this.vacancyService.findOne(user, vacancyId);
        const generation = await this.prisma.experienceCompetencyGeneration.findFirst({
            where: { vacancyId },
            orderBy: { createdAt: 'desc' },
        });
        return generation === null ? null : this.toResponse(generation);
    }
    async process(generationId) {
        const claim = await this.prisma.experienceCompetencyGeneration.updateMany({
            where: { id: generationId, status: client_1.ExperienceCompetencyGenerationStatus.QUEUED },
            data: {
                status: client_1.ExperienceCompetencyGenerationStatus.PROCESSING,
                startedAt: new Date(),
                stage: client_1.ExperienceCompetencyGenerationStage.ANALYZING_JOB,
                ...stageDetails.ANALYZING_JOB,
            },
        });
        if (claim.count === 0)
            return;
        try {
            const generation = await this.prisma.experienceCompetencyGeneration.findUnique({
                where: { id: generationId },
                include: { vacancy: true },
            });
            if (generation === null) {
                throw new Error('Vacancy is unavailable for experience-area generation.');
            }
            const analysis = await this.assessmentAreaSuggestionLlmService.analyzeRole({
                vacancyTitle: generation.vacancy.title,
                jobDescription: generation.vacancy.jobDescription,
                seniority: `${generation.vacancy.experienceMin}-${generation.vacancy.experienceMax} years of experience`,
            });
            const areas = this.normalizeAreas(analysis.experienceAreas);
            await this.prisma.experienceCompetencyGeneration.updateMany({
                where: { id: generationId, status: client_1.ExperienceCompetencyGenerationStatus.PROCESSING },
                data: {
                    stage: client_1.ExperienceCompetencyGenerationStage.SAVING_AREAS,
                    ...stageDetails.SAVING_AREAS,
                },
            });
            await this.vacancyExperienceCompetencyService.replaceGeneratedAreas(generation.vacancyId, areas);
            await this.prisma.experienceCompetencyGeneration.updateMany({
                where: { id: generationId, status: client_1.ExperienceCompetencyGenerationStatus.PROCESSING },
                data: {
                    status: client_1.ExperienceCompetencyGenerationStatus.COMPLETED,
                    stage: client_1.ExperienceCompetencyGenerationStage.COMPLETED,
                    ...stageDetails.COMPLETED,
                    result: structuredClone(areas.map((area) => area.name)),
                    error: null,
                    completedAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Experience-area generation failed', {
                event: 'experience_competency.generation.failed',
                generationId,
                error: (0, error_serializer_js_1.serializeError)(error),
            });
            await this.prisma.experienceCompetencyGeneration.updateMany({
                where: { id: generationId, status: client_1.ExperienceCompetencyGenerationStatus.PROCESSING },
                data: {
                    status: client_1.ExperienceCompetencyGenerationStatus.FAILED,
                    message: "We couldn't identify experience areas.",
                    error: this.errorMessage(error),
                    completedAt: new Date(),
                },
            });
        }
    }
    findActiveGeneration(vacancyId) {
        return this.prisma.experienceCompetencyGeneration.findFirst({
            where: {
                vacancyId,
                status: {
                    in: [
                        client_1.ExperienceCompetencyGenerationStatus.QUEUED,
                        client_1.ExperienceCompetencyGenerationStatus.PROCESSING,
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    normalizeAreas(areas) {
        const known = new Set();
        const normalized = areas
            .map((area) => ({ ...area, name: area.name.replaceAll(/\s+/g, ' ').trim() }))
            .filter((area) => {
            const key = area.name.toLocaleLowerCase();
            if (known.has(key))
                return false;
            known.add(key);
            return true;
        });
        if (normalized.length === 0) {
            throw new Error('The AI response did not include experience areas.');
        }
        return normalized;
    }
    toResponse(generation) {
        return {
            ...generation,
            error: generation.status === client_1.ExperienceCompetencyGenerationStatus.FAILED
                ? generation.message
                : null,
            generationId: generation.id,
            result: generation.result === null ? null : this.parseResult(generation.result),
        };
    }
    parseResult(result) {
        if (!Array.isArray(result))
            return [];
        return result.filter((item) => typeof item === 'string');
    }
    isActiveGenerationConflict(error) {
        return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
    }
    errorMessage(error) {
        if (error instanceof Error) {
            return error.cause instanceof Error ? error.cause.message : error.message;
        }
        return "We couldn't determine the generation error.";
    }
};
exports.VacancyAssessmentSuggestionService = VacancyAssessmentSuggestionService;
exports.VacancyAssessmentSuggestionService = VacancyAssessmentSuggestionService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(assessment_area_suggestion_types_js_1.ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService,
        vacancy_experience_competency_service_js_1.VacancyExperienceCompetencyService, Object, structured_logger_service_js_1.StructuredLogger])
], VacancyAssessmentSuggestionService);
//# sourceMappingURL=vacancy-assessment-suggestion.service.js.map