import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  QuestionStatus,
  type Question,
  type VacancyCustomQuestion,
  type VacancyQuestion,
} from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { QuestionService } from '../questions/question.service.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { AddVacancyQuestionDto } from './dto/add-vacancy-question.dto.js';
import type { CreateVacancyCustomQuestionDto } from './dto/create-vacancy-custom-question.dto.js';
import type { UpdateVacancyQuestionDto } from './dto/update-vacancy-question.dto.js';
import type { UpdateVacancyCustomQuestionDto } from './dto/update-vacancy-custom-question.dto.js';
import type { QueryQuestionsDto } from '../questions/dto/query-questions.dto.js';

const vacancyQuestionInclude = {
  question: { select: { estimatedAnswerTimeSeconds: true } },
} as const;

type IVacancyQuestionRecord = Prisma.VacancyQuestionGetPayload<{
  include: typeof vacancyQuestionInclude;
}>;

export interface IVacancyQuestionResponse extends VacancyQuestion {
  estimatedAnswerTimeSeconds: number;
}

export type IVacancyCustomQuestionResponse = VacancyCustomQuestion;

@Injectable()
export class VacancyQuestionSetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vacancyService: VacancyService,
    private readonly vacancyTechnologyService: VacancyTechnologyService,
    private readonly questionService: QuestionService,
  ) {}

  async findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyQuestionResponse[]> {
    await this.vacancyService.findOne(user, vacancyId);
    return this.prisma.vacancyQuestion
      .findMany({
        where: { vacancyId },
        include: vacancyQuestionInclude,
        orderBy: { sequence: 'asc' },
      })
      .then((questions) => questions.map((question) => this.toResponse(question)));
  }

  async add(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: AddVacancyQuestionDto,
  ): Promise<IVacancyQuestionResponse> {
    const [, question] = await Promise.all([
      this.vacancyService.findOne(user, vacancyId),
      this.questionService.findOne(dto.questionId),
      this.vacancyTechnologyService.findAll(user, vacancyId),
    ]);
    if (question.status !== QuestionStatus.APPROVED) {
      throw new UnprocessableEntityException(
        'Question must be active and match a configured vacancy technology and difficulty.',
      );
    }
    return this.prisma
      .$transaction((transaction) => this.createSnapshot(transaction, vacancyId, question))
      .then((question) => this.toResponse(question));
  }

  async findAvailable(
    user: IAuthenticatedUser,
    vacancyId: string,
    query: QueryQuestionsDto,
  ): Promise<{
    items: Array<Question & { alreadyAdded: boolean }>;
    page: number;
    pageSize: number;
    total: number;
  }> {
    await this.vacancyService.findOne(user, vacancyId);
    const result = await this.questionService.searchApproved(query);
    const addedQuestionIds = new Set(
      (
        await this.prisma.vacancyQuestion.findMany({
          where: { vacancyId, questionId: { in: result.items.map((question) => question.id) } },
          select: { questionId: true },
        })
      ).map((row) => row.questionId),
    );
    return {
      items: result.items.map((question) => ({
        ...question,
        alreadyAdded: addedQuestionIds.has(question.id),
      })),
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      total: result.total,
    };
  }

  async findAllCustom(
    user: IAuthenticatedUser,
    vacancyId: string,
  ): Promise<IVacancyCustomQuestionResponse[]> {
    await this.vacancyService.findOne(user, vacancyId);
    return this.prisma.vacancyCustomQuestion.findMany({
      where: { vacancyId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createCustom(
    user: IAuthenticatedUser,
    vacancyId: string,
    dto: CreateVacancyCustomQuestionDto,
  ): Promise<IVacancyCustomQuestionResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    return this.prisma.$transaction(async (transaction) => {
      const lastQuestion = await transaction.vacancyCustomQuestion.findFirst({
        where: { vacancyId },
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });
      return transaction.vacancyCustomQuestion.create({
        data: {
          vacancyId,
          questionText: dto.questionText.trim(),
          evaluationCriteria: dto.evaluationCriteria?.trim() || null,
          displayOrder: (lastQuestion?.displayOrder ?? 0) + 1,
        },
      });
    });
  }

  async updateCustom(
    user: IAuthenticatedUser,
    vacancyId: string,
    customQuestionId: string,
    dto: UpdateVacancyCustomQuestionDto,
  ): Promise<IVacancyCustomQuestionResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one custom question field is required.');
    }
    const question = await this.findCustom(vacancyId, customQuestionId);
    if (dto.displayOrder !== undefined && dto.displayOrder !== question.displayOrder) {
      await this.reorderCustom(vacancyId, customQuestionId, dto.displayOrder);
    }
    if (dto.questionText !== undefined || dto.evaluationCriteria !== undefined) {
      return this.prisma.vacancyCustomQuestion.update({
        where: { id: customQuestionId },
        data: {
          ...(dto.questionText === undefined ? {} : { questionText: dto.questionText.trim() }),
          ...(dto.evaluationCriteria === undefined
            ? {}
            : {
                evaluationCriteria:
                  dto.evaluationCriteria === null ? null : dto.evaluationCriteria.trim() || null,
              }),
        },
      });
    }
    return this.prisma.vacancyCustomQuestion.findUniqueOrThrow({ where: { id: customQuestionId } });
  }

  async removeCustom(
    user: IAuthenticatedUser,
    vacancyId: string,
    customQuestionId: string,
  ): Promise<void> {
    await this.vacancyService.findOne(user, vacancyId);
    await this.findCustom(vacancyId, customQuestionId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.vacancyCustomQuestion.delete({ where: { id: customQuestionId } });
      await this.replaceCustomOrders(
        transaction,
        await transaction.vacancyCustomQuestion.findMany({
          where: { vacancyId },
          orderBy: { displayOrder: 'asc' },
        }),
      );
    });
  }

  async update(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyQuestionId: string,
    dto: UpdateVacancyQuestionDto,
  ): Promise<IVacancyQuestionResponse> {
    await this.vacancyService.findOne(user, vacancyId);
    const vacancyQuestion = await this.findOne(vacancyId, vacancyQuestionId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one vacancy question field is required.');
    }
    if (dto.sequence !== undefined && dto.sequence !== vacancyQuestion.sequence) {
      await this.reorder(vacancyId, vacancyQuestionId, dto.sequence);
    }
    return this.prisma.vacancyQuestion
      .findFirst({ where: { id: vacancyQuestionId, vacancyId }, include: vacancyQuestionInclude })
      .then((question) => {
        if (question === null) throw new NotFoundException('Vacancy question not found.');
        return this.toResponse(question);
      });
  }

  async remove(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyQuestionId: string,
  ): Promise<void> {
    await this.vacancyService.findOne(user, vacancyId);
    await this.findOne(vacancyId, vacancyQuestionId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.vacancyQuestion.delete({ where: { id: vacancyQuestionId } });
      const remaining = await transaction.vacancyQuestion.findMany({
        where: { vacancyId },
        orderBy: { sequence: 'asc' },
      });
      await this.replaceSequences(transaction, remaining);
    });
  }

  private async findOne(vacancyId: string, vacancyQuestionId: string): Promise<VacancyQuestion> {
    const vacancyQuestion = await this.prisma.vacancyQuestion.findFirst({
      where: { id: vacancyQuestionId, vacancyId },
    });
    if (vacancyQuestion === null) {
      throw new NotFoundException('Vacancy question not found.');
    }
    return vacancyQuestion;
  }

  private async findCustom(
    vacancyId: string,
    customQuestionId: string,
  ): Promise<VacancyCustomQuestion> {
    const question = await this.prisma.vacancyCustomQuestion.findFirst({
      where: { id: customQuestionId, vacancyId },
    });
    if (question === null) throw new NotFoundException('Custom vacancy question not found.');
    return question;
  }

  private async createSnapshot(
    transaction: Prisma.TransactionClient,
    vacancyId: string,
    question: Question,
  ): Promise<IVacancyQuestionRecord> {
    try {
      const lastQuestion = await transaction.vacancyQuestion.findFirst({
        where: { vacancyId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });
      return await transaction.vacancyQuestion.create({
        data: {
          vacancyId,
          questionId: question.id,
          sequence: (lastQuestion?.sequence ?? 0) + 1,
          questionText: question.questionText,
          difficulty: question.difficulty,
          questionType: question.questionType,
          followUpAllowed: question.followUpAllowed,
          evaluationCriteria: this.toInputJsonValue(question.evaluationCriteria),
        },
        include: vacancyQuestionInclude,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This question is already selected for the vacancy.');
      }
      throw error;
    }
  }

  private async reorder(
    vacancyId: string,
    vacancyQuestionId: string,
    sequence: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const questions = await transaction.vacancyQuestion.findMany({
        where: { vacancyId },
        orderBy: { sequence: 'asc' },
      });
      const moved = questions.find((question) => question.id === vacancyQuestionId);
      if (moved === undefined) {
        throw new NotFoundException('Vacancy question not found.');
      }
      if (sequence > questions.length) {
        throw new BadRequestException('sequence must be within the vacancy question set.');
      }
      const reordered = questions.filter((question) => question.id !== vacancyQuestionId);
      reordered.splice(sequence - 1, 0, moved);
      await this.replaceSequences(transaction, reordered);
    });
  }

  private async reorderCustom(
    vacancyId: string,
    customQuestionId: string,
    displayOrder: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const questions = await transaction.vacancyCustomQuestion.findMany({
        where: { vacancyId },
        orderBy: { displayOrder: 'asc' },
      });
      if (displayOrder > questions.length) {
        throw new BadRequestException('displayOrder must be within the custom question set.');
      }
      const moved = questions.find((question) => question.id === customQuestionId);
      if (moved === undefined) throw new NotFoundException('Custom vacancy question not found.');
      const reordered = questions.filter((question) => question.id !== customQuestionId);
      reordered.splice(displayOrder - 1, 0, moved);
      await this.replaceCustomOrders(transaction, reordered);
    });
  }

  private async replaceSequences(
    transaction: Prisma.TransactionClient,
    questions: VacancyQuestion[],
  ): Promise<void> {
    for (const [index, question] of questions.entries()) {
      await transaction.vacancyQuestion.update({
        where: { id: question.id },
        data: { sequence: -(index + 1) },
      });
    }
    for (const [index, question] of questions.entries()) {
      await transaction.vacancyQuestion.update({
        where: { id: question.id },
        data: { sequence: index + 1 },
      });
    }
  }

  private async replaceCustomOrders(
    transaction: Prisma.TransactionClient,
    questions: VacancyCustomQuestion[],
  ): Promise<void> {
    for (const [index, question] of questions.entries()) {
      await transaction.vacancyCustomQuestion.update({
        where: { id: question.id },
        data: { displayOrder: -(index + 1) },
      });
    }
    for (const [index, question] of questions.entries()) {
      await transaction.vacancyCustomQuestion.update({
        where: { id: question.id },
        data: { displayOrder: index + 1 },
      });
    }
  }

  private toInputJsonValue(
    value: Prisma.JsonValue | Prisma.InputJsonObject,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value === null ? Prisma.JsonNull : (structuredClone(value) as Prisma.InputJsonValue);
  }

  private toResponse(question: IVacancyQuestionRecord): IVacancyQuestionResponse {
    const { question: sourceQuestion, ...snapshot } = question;
    return { ...snapshot, estimatedAnswerTimeSeconds: sourceQuestion.estimatedAnswerTimeSeconds };
  }
}
