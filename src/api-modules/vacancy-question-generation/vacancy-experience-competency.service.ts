import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type VacancyExperienceArea, type VacancyExperienceQuestion } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { configurationValues } from '../../infrastructure/config/configuration-values.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { CreateExperienceCompetencyAreaDto } from './dto/create-experience-competency-area.dto.js';
import type { CreateExperienceCompetencyPlanDto } from './dto/create-experience-competency-plan.dto.js';
import type { SaveExperienceCompetencyConfigurationDto } from './dto/save-experience-competency-configuration.dto.js';
import type { UpdateExperienceCompetencyAreaDto } from './dto/update-experience-competency-area.dto.js';
import type { UpdateExperienceCompetencyQuestionDto } from './dto/update-experience-competency-question.dto.js';

const areaInclude = { questions: { orderBy: { sequence: 'asc' } } } as const;

export type IExperienceCompetencyAreaResponse = Prisma.VacancyExperienceAreaGetPayload<{
  include: typeof areaInclude;
}>;

export type IGeneratedExperienceCompetencyArea = Pick<
  CreateExperienceCompetencyAreaDto,
  'importance' | 'name' | 'reason' | 'whatToEstablish' | 'questions'
>;

interface IGeneratedAreaInput {
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  name: string;
}

const experienceQuestionTemplates = [
  'How many years of professional experience do you have working with {area}?',
  'What have you personally worked on using {area}?',
  'What responsibilities did you personally have when working with {area}?',
  'What role did you play in the team when working with {area}?',
  'Tell us about some significant problems or challenges you handled while working with {area}.',
] as const;

@Injectable()
export class VacancyExperienceCompetencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
  ) {}

  async findAll(
    user: IAuthenticatedUser,
    vacancyId: string,
  ): Promise<IExperienceCompetencyAreaResponse[]> {
    await this.vacancyService.findOne(user, vacancyId);
    return this.prisma.vacancyExperienceArea.findMany({
      where: { vacancyId },
      include: areaInclude,
      orderBy: { sequence: 'asc' },
    });
  }

  async createPlan(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: CreateExperienceCompetencyPlanDto,
  ): Promise<IExperienceCompetencyAreaResponse[]> {
    await this.vacancyService.findOne(user, vacancyId);
    return this.prisma.$transaction(async (transaction) => {
      const lastArea = await transaction.vacancyExperienceArea.findFirst({
        where: { vacancyId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });
      const areas = await Promise.all(
        dto.areas.map((area, index) =>
          this.createAreaRecord(
            transaction,
            vacancyId,
            area,
            (lastArea?.sequence ?? 0) + index + 1,
          ),
        ),
      );
      await this.synchronizeExperienceAreaNames(transaction, vacancyId);
      return areas;
    });
  }

  async createGeneratedPlan(
    vacancyId: string,
    areas: IGeneratedExperienceCompetencyArea[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const vacancy = await transaction.vacancy.findUnique({
        where: { id: vacancyId },
        select: { id: true },
      });
      if (vacancy === null) throw new ConflictException('The vacancy is unavailable.');
      const lastArea = await transaction.vacancyExperienceArea.findFirst({
        where: { vacancyId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });
      await Promise.all(
        areas.map((area, index) =>
          this.createAreaRecord(
            transaction,
            vacancyId,
            area,
            (lastArea?.sequence ?? 0) + index + 1,
          ),
        ),
      );
      await this.synchronizeExperienceAreaNames(transaction, vacancyId);
    });
  }

  async replaceGeneratedAreas(vacancyId: string, areas: IGeneratedAreaInput[]): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const vacancy = await transaction.vacancy.findUnique({
        where: { id: vacancyId },
        select: { id: true },
      });
      if (vacancy === null) throw new ConflictException('The vacancy is unavailable.');
      await transaction.vacancyExperienceQuestion.deleteMany({ where: { area: { vacancyId } } });
      await transaction.vacancyExperienceArea.deleteMany({ where: { vacancyId } });
      await Promise.all(
        areas.map((area, index) =>
          this.createAreaRecord(
            transaction,
            vacancyId,
            {
              ...area,
              reason: `Assess the candidate's practical experience with ${area.name}.`,
              whatToEstablish: [
                'Professional experience duration',
                'Personal contributions and responsibilities',
                'Team role and challenges handled',
              ],
              questions: this.createStandardQuestions(area.name),
            },
            index + 1,
          ),
        ),
      );
      await this.synchronizeExperienceAreaNames(transaction, vacancyId);
    });
  }

  async saveConfiguration(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: SaveExperienceCompetencyConfigurationDto,
  ): Promise<IExperienceCompetencyAreaResponse[]> {
    await this.vacancyService.findOne(user, vacancyId);
    if (
      dto.areas.some(
        (area) =>
          area.name.trim().length === 0 ||
          area.questions.some((question) => question.questionText.trim().length === 0),
      )
    ) {
      throw new BadRequestException('Experience area names and questions cannot be empty.');
    }
    return this.prisma.$transaction(async (transaction) => {
      await transaction.vacancyExperienceQuestion.deleteMany({ where: { area: { vacancyId } } });
      await transaction.vacancyExperienceArea.deleteMany({ where: { vacancyId } });
      const areas = await Promise.all(
        dto.areas.map((area, index) =>
          this.createAreaRecord(
            transaction,
            vacancyId,
            {
              importance: area.importance ?? 'MEDIUM',
              name: area.name.trim(),
              reason: `Assess the candidate's practical experience with ${area.name.trim()}.`,
              whatToEstablish: [
                'Professional experience duration',
                'Personal contributions and responsibilities',
                'Team role and challenges handled',
              ],
              questions: area.questions.map((question) => ({
                questionText: question.questionText.trim(),
              })),
            },
            index + 1,
          ),
        ),
      );
      await this.synchronizeExperienceAreaNames(transaction, vacancyId);
      return areas;
    });
  }

  async updateArea(
    user: IAuthenticatedUser,
    vacancyId: string,
    areaId: string,
    dto: UpdateExperienceCompetencyAreaDto,
  ): Promise<IExperienceCompetencyAreaResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one assessment area field is required.');
    }
    await this.findArea(vacancyId, areaId);
    return this.prisma.$transaction(async (transaction) => {
      const area = await transaction.vacancyExperienceArea.update({
        where: { id: areaId },
        data: {
          ...dto,
          ...(dto.whatToEstablish === undefined
            ? {}
            : { whatToEstablish: this.toInputJsonValue(dto.whatToEstablish) }),
        },
        include: areaInclude,
      });
      await this.synchronizeExperienceAreaNames(transaction, vacancyId);
      return area;
    });
  }

  async removeArea(user: IAuthenticatedUser, vacancyId: string, areaId: string): Promise<void> {
    await this.vacancyService.findOne(user, vacancyId);
    await this.findArea(vacancyId, areaId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.vacancyExperienceArea.delete({ where: { id: areaId } });
      await this.replaceAreaSequences(
        transaction,
        await transaction.vacancyExperienceArea.findMany({
          where: { vacancyId },
          orderBy: { sequence: 'asc' },
        }),
      );
      await this.synchronizeExperienceAreaNames(transaction, vacancyId);
    });
  }

  async updateQuestion(
    user: IAuthenticatedUser,
    vacancyId: string,
    questionId: string,
    dto: UpdateExperienceCompetencyQuestionDto,
  ): Promise<VacancyExperienceQuestion> {
    await this.vacancyService.findOne(user, vacancyId);
    if (Object.keys(dto).length === 0)
      throw new BadRequestException('At least one question field is required.');
    const question = await this.findQuestion(vacancyId, questionId);
    if (dto.sequence !== undefined && dto.sequence !== question.sequence) {
      await this.reorderQuestions(question.areaId, questionId, dto.sequence);
    }
    if (dto.questionText !== undefined) {
      return this.prisma.vacancyExperienceQuestion.update({
        where: { id: questionId },
        data: { questionText: dto.questionText },
      });
    }
    return this.prisma.vacancyExperienceQuestion.findUniqueOrThrow({ where: { id: questionId } });
  }

  async removeQuestion(
    user: IAuthenticatedUser,
    vacancyId: string,
    questionId: string,
  ): Promise<void> {
    await this.vacancyService.findOne(user, vacancyId);
    const question = await this.findQuestion(vacancyId, questionId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.vacancyExperienceQuestion.delete({ where: { id: questionId } });
      await this.replaceQuestionSequences(
        transaction,
        await transaction.vacancyExperienceQuestion.findMany({
          where: { areaId: question.areaId },
          orderBy: { sequence: 'asc' },
        }),
      );
    });
  }

  private async createAreaRecord(
    transaction: Prisma.TransactionClient,
    vacancyId: string,
    dto: CreateExperienceCompetencyAreaDto,
    sequence: number,
  ): Promise<IExperienceCompetencyAreaResponse> {
    return transaction.vacancyExperienceArea.create({
      data: {
        vacancyId,
        name: dto.name,
        importance: dto.importance,
        reason: dto.reason,
        whatToEstablish: this.toInputJsonValue(dto.whatToEstablish),
        sequence,
        questions: {
          create: dto.questions.map((question, index) => ({
            questionText: question.questionText,
            sequence: index + 1,
          })),
        },
      },
      include: areaInclude,
    });
  }

  private createStandardQuestions(area: string): Array<{ questionText: string }> {
    const questionCount = configurationValues.assessmentAreaGeneration.questionsPerArea;
    if (questionCount > experienceQuestionTemplates.length) {
      throw new Error('Not enough standard experience question templates are configured.');
    }
    return experienceQuestionTemplates.slice(0, questionCount).map((template) => ({
      questionText: template.replace('{area}', area),
    }));
  }

  private async synchronizeExperienceAreaNames(
    transaction: Prisma.TransactionClient,
    vacancyId: string,
  ): Promise<void> {
    const areas = await transaction.vacancyExperienceArea.findMany({
      where: { vacancyId },
      orderBy: { sequence: 'asc' },
      select: { name: true },
    });
    await transaction.vacancy.update({
      where: { id: vacancyId },
      data: { experienceAreas: areas.map((area) => area.name) },
    });
  }

  private async findArea(vacancyId: string, areaId: string): Promise<VacancyExperienceArea> {
    const area = await this.prisma.vacancyExperienceArea.findFirst({
      where: { id: areaId, vacancyId },
    });
    if (area === null) throw new NotFoundException('Experience and competency area not found.');
    return area;
  }

  private async findQuestion(
    vacancyId: string,
    questionId: string,
  ): Promise<VacancyExperienceQuestion> {
    const question = await this.prisma.vacancyExperienceQuestion.findFirst({
      where: { id: questionId, area: { vacancyId } },
    });
    if (question === null)
      throw new NotFoundException('Experience and competency question not found.');
    return question;
  }

  private async reorderQuestions(
    areaId: string,
    questionId: string,
    sequence: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const questions = await transaction.vacancyExperienceQuestion.findMany({
        where: { areaId },
        orderBy: { sequence: 'asc' },
      });
      if (sequence > questions.length)
        throw new BadRequestException('sequence must be within the area.');
      const moved = questions.find((question) => question.id === questionId);
      if (moved === undefined)
        throw new NotFoundException('Experience and competency question not found.');
      const reordered = questions.filter((question) => question.id !== questionId);
      reordered.splice(sequence - 1, 0, moved);
      await this.replaceQuestionSequences(transaction, reordered);
    });
  }

  private async replaceAreaSequences(
    transaction: Prisma.TransactionClient,
    areas: VacancyExperienceArea[],
  ): Promise<void> {
    for (const [index, area] of areas.entries()) {
      await transaction.vacancyExperienceArea.update({
        where: { id: area.id },
        data: { sequence: -(index + 1) },
      });
    }
    for (const [index, area] of areas.entries()) {
      await transaction.vacancyExperienceArea.update({
        where: { id: area.id },
        data: { sequence: index + 1 },
      });
    }
  }

  private async replaceQuestionSequences(
    transaction: Prisma.TransactionClient,
    questions: VacancyExperienceQuestion[],
  ): Promise<void> {
    for (const [index, question] of questions.entries()) {
      await transaction.vacancyExperienceQuestion.update({
        where: { id: question.id },
        data: { sequence: -(index + 1) },
      });
    }
    for (const [index, question] of questions.entries()) {
      await transaction.vacancyExperienceQuestion.update({
        where: { id: question.id },
        data: { sequence: index + 1 },
      });
    }
  }

  private toInputJsonValue(value: string[]): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue;
  }
}
