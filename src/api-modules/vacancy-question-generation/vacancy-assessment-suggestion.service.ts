import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  ExperienceCompetencyGenerationStage,
  ExperienceCompetencyGenerationStatus,
  Prisma,
} from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { serializeError } from '../../infrastructure/logging/error-serializer.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import {
  ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE,
  type IAssessmentArea,
  type IAssessmentAreaSuggestionLlmService,
} from '../ai/assessment-area-suggestion.types.js';
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

const stageDetails: Record<
  ExperienceCompetencyGenerationStage,
  { message: string; progress: number }
> = {
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

@Injectable()
export class VacancyAssessmentSuggestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
    private readonly vacancyExperienceCompetencyService: VacancyExperienceCompetencyService,
    @Inject(ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE)
    private readonly assessmentAreaSuggestionLlmService: IAssessmentAreaSuggestionLlmService,
    private readonly logger: StructuredLogger,
  ) {}

  async start(
    user: IAuthenticatedUser,
    vacancyId: string,
  ): Promise<IExperienceCompetencyGenerationResponse> {
    const vacancy = await this.vacancyService.findOne(user, vacancyId);
    if (vacancy.jobDescription.trim().length < 30) {
      throw new UnprocessableEntityException(
        'Add a more detailed job description before requesting suggestions.',
      );
    }
    const active = await this.findActiveGeneration(vacancyId);
    if (active !== null) return this.toResponse(active);
    try {
      const generation = await this.prisma.experienceCompetencyGeneration.create({
        data: {
          vacancyId,
          status: ExperienceCompetencyGenerationStatus.QUEUED,
          stage: ExperienceCompetencyGenerationStage.PREPARING,
          ...stageDetails.PREPARING,
        },
      });
      return this.toResponse(generation);
    } catch (error: unknown) {
      if (!this.isActiveGenerationConflict(error)) throw error;
      const concurrentGeneration = await this.findActiveGeneration(vacancyId);
      if (concurrentGeneration === null) throw error;
      return this.toResponse(concurrentGeneration);
    }
  }

  async findCurrent(
    user: IAuthenticatedUser,
    vacancyId: string,
  ): Promise<IExperienceCompetencyGenerationResponse | null> {
    await this.vacancyService.findOne(user, vacancyId);
    const generation = await this.prisma.experienceCompetencyGeneration.findFirst({
      where: { vacancyId },
      orderBy: { createdAt: 'desc' },
    });
    return generation === null ? null : this.toResponse(generation);
  }

  async process(generationId: string): Promise<void> {
    const claim = await this.prisma.experienceCompetencyGeneration.updateMany({
      where: { id: generationId, status: ExperienceCompetencyGenerationStatus.QUEUED },
      data: {
        status: ExperienceCompetencyGenerationStatus.PROCESSING,
        startedAt: new Date(),
        stage: ExperienceCompetencyGenerationStage.ANALYZING_JOB,
        ...stageDetails.ANALYZING_JOB,
      },
    });
    if (claim.count === 0) return;
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
        where: { id: generationId, status: ExperienceCompetencyGenerationStatus.PROCESSING },
        data: {
          stage: ExperienceCompetencyGenerationStage.SAVING_AREAS,
          ...stageDetails.SAVING_AREAS,
        },
      });
      await this.vacancyExperienceCompetencyService.replaceGeneratedAreas(
        generation.vacancyId,
        areas,
      );
      await this.prisma.experienceCompetencyGeneration.updateMany({
        where: { id: generationId, status: ExperienceCompetencyGenerationStatus.PROCESSING },
        data: {
          status: ExperienceCompetencyGenerationStatus.COMPLETED,
          stage: ExperienceCompetencyGenerationStage.COMPLETED,
          ...stageDetails.COMPLETED,
          result: structuredClone(
            areas.map((area) => area.name),
          ) as unknown as Prisma.InputJsonValue,
          error: null,
          completedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      this.logger.error('Experience-area generation failed', {
        event: 'experience_competency.generation.failed',
        generationId,
        error: serializeError(error),
      });
      await this.prisma.experienceCompetencyGeneration.updateMany({
        where: { id: generationId, status: ExperienceCompetencyGenerationStatus.PROCESSING },
        data: {
          status: ExperienceCompetencyGenerationStatus.FAILED,
          message: "We couldn't identify experience areas.",
          error: this.errorMessage(error),
          completedAt: new Date(),
        },
      });
    }
  }

  private findActiveGeneration(vacancyId: string) {
    return this.prisma.experienceCompetencyGeneration.findFirst({
      where: {
        vacancyId,
        status: {
          in: [
            ExperienceCompetencyGenerationStatus.QUEUED,
            ExperienceCompetencyGenerationStatus.PROCESSING,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private normalizeAreas(areas: IAssessmentArea[]): IAssessmentArea[] {
    const known = new Set<string>();
    const normalized = areas
      .map((area) => ({ ...area, name: area.name.replaceAll(/\s+/g, ' ').trim() }))
      .filter((area) => {
        const key = area.name.toLocaleLowerCase();
        if (known.has(key)) return false;
        known.add(key);
        return true;
      });
    if (normalized.length === 0) {
      throw new Error('The AI response did not include experience areas.');
    }
    return normalized;
  }

  private toResponse(generation: {
    completedAt: Date | null;
    error: string | null;
    id: string;
    message: string;
    progress: number;
    result: Prisma.JsonValue | null;
    stage: ExperienceCompetencyGenerationStage;
    startedAt: Date | null;
    status: ExperienceCompetencyGenerationStatus;
  }): IExperienceCompetencyGenerationResponse {
    return {
      ...generation,
      error:
        generation.status === ExperienceCompetencyGenerationStatus.FAILED
          ? generation.message
          : null,
      generationId: generation.id,
      result: generation.result === null ? null : this.parseResult(generation.result),
    };
  }

  private parseResult(result: Prisma.JsonValue): string[] {
    if (!Array.isArray(result)) return [];
    return result.filter((item): item is string => typeof item === 'string');
  }

  private isActiveGenerationConflict(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.cause instanceof Error ? error.cause.message : error.message;
    }
    return "We couldn't determine the generation error.";
  }
}
