import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, RequirementType, type Question, type VacancyQuestion } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { configurationValues } from '../../infrastructure/config/configuration-values.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { QuestionService } from '../questions/question.service.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';

export interface IGeneratedVacancyQuestion {
  id: string;
  questionId: string;
  sequence: number;
}

export interface IGenerateVacancyQuestionsResponse {
  vacancyId: string;
  generatedCount: number;
  questions: IGeneratedVacancyQuestion[];
}

interface IQuestionBucket {
  questions: Question[];
  requirementType: RequirementType;
  technologyId: string;
  technologySegmentId: string;
}

@Injectable()
export class VacancyQuestionGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
    private readonly vacancyTechnologyService: VacancyTechnologyService,
    private readonly questionService: QuestionService,
  ) {}

  async generate(
    user: IAuthenticatedUser,
    vacancyId: string,
  ): Promise<IGenerateVacancyQuestionsResponse> {
    const vacancy = await this.vacancyService.findOne(user, vacancyId);
    const configuredTechnologies = await this.vacancyTechnologyService.findAll(user, vacancyId);
    if (configuredTechnologies.length === 0) {
      throw new UnprocessableEntityException('Configure at least one vacancy technology first.');
    }

    const questions = await this.questionService.findEligibleForVacancyGeneration(
      configuredTechnologies.map(({ technologyId }) => technologyId),
      vacancy.difficulty,
    );
    const selectedQuestions = this.orderQuestions(questions, configuredTechnologies);
    try {
      const generatedQuestions = await this.prisma.$transaction(async (transaction) => {
        const existingQuestion = await transaction.vacancyQuestion.findFirst({
          where: { vacancyId },
          select: { id: true },
        });
        if (existingQuestion !== null) {
          throw new ConflictException('Questions have already been generated for this vacancy.');
        }

        const snapshots: VacancyQuestion[] = [];
        for (const [index, question] of selectedQuestions.entries()) {
          snapshots.push(
            await transaction.vacancyQuestion.create({
              data: {
                vacancyId,
                questionId: question.id,
                sequence: index + 1,
                questionText: question.questionText,
                difficulty: question.difficulty,
                questionType: question.questionType,
                followUpAllowed: question.followUpAllowed,
                evaluationCriteria: this.toInputJsonValue(question.evaluationCriteria),
              },
            }),
          );
        }
        return snapshots;
      });
      return {
        vacancyId,
        generatedCount: generatedQuestions.length,
        questions: generatedQuestions.map(({ id, questionId, sequence }) => ({
          id,
          questionId,
          sequence,
        })),
      };
    } catch (error: unknown) {
      this.rethrowConcurrentGeneration(error);
    }
  }

  private orderQuestions(
    questions: Question[],
    configuredTechnologies: Array<{
      requirementType: RequirementType;
      segmentSelections: string[];
      technologyId: string;
    }>,
  ): Question[] {
    const buckets = new Map<string, IQuestionBucket>();
    for (const question of questions) {
      const requirementType = this.findRequirementType(question, configuredTechnologies);
      if (requirementType === undefined) {
        continue;
      }
      const key = `${question.technologyId}:${question.technologySegmentId}`;
      const bucket = buckets.get(key) ?? {
        technologyId: question.technologyId,
        technologySegmentId: question.technologySegmentId,
        requirementType,
        questions: [],
      };
      bucket.questions.push(question);
      buckets.set(key, bucket);
    }

    return [RequirementType.REQUIRED, RequirementType.PREFERRED].flatMap((requirementType) => {
      const questionsPerTechnology =
        requirementType === RequirementType.REQUIRED
          ? configurationValues.technicalQuestionGeneration.requiredQuestionsPerTechnology
          : configurationValues.technicalQuestionGeneration.preferredQuestionsPerTechnology;
      const ordered = this.roundRobin(
        [...buckets.values()]
          .filter((bucket) => bucket.requirementType === requirementType)
          .sort(
            (left, right) =>
              left.technologyId.localeCompare(right.technologyId) ||
              left.technologySegmentId.localeCompare(right.technologySegmentId),
          ),
      );
      const selectedPerTechnology = new Map<string, number>();
      return ordered.filter((question) => {
        const selected = selectedPerTechnology.get(question.technologyId) ?? 0;
        if (selected >= questionsPerTechnology) return false;
        selectedPerTechnology.set(question.technologyId, selected + 1);
        return true;
      });
    });
  }

  private findRequirementType(
    question: Question,
    configuredTechnologies: Array<{
      requirementType: RequirementType;
      segmentSelections: string[];
      technologyId: string;
    }>,
  ): RequirementType | undefined {
    for (const requirementType of [RequirementType.REQUIRED, RequirementType.PREFERRED]) {
      if (
        configuredTechnologies.some(
          (configuration) =>
            configuration.requirementType === requirementType &&
            configuration.technologyId === question.technologyId &&
            (configuration.segmentSelections.includes('ALL') ||
              configuration.segmentSelections.includes(question.technologySegmentId)),
        )
      ) {
        return requirementType;
      }
    }
    return undefined;
  }

  private roundRobin(buckets: IQuestionBucket[]): Question[] {
    const ordered: Question[] = [];
    for (let questionIndex = 0; ; questionIndex += 1) {
      let foundQuestion = false;
      for (const bucket of buckets) {
        const question = bucket.questions[questionIndex];
        if (question !== undefined) {
          ordered.push(question);
          foundQuestion = true;
        }
      }
      if (!foundQuestion) {
        return ordered;
      }
    }
  }

  private toInputJsonValue(
    value: Prisma.JsonValue,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value === null ? Prisma.JsonNull : (structuredClone(value) as Prisma.InputJsonValue);
  }

  private rethrowConcurrentGeneration(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Questions have already been generated for this vacancy.');
    }
    throw error;
  }
}
