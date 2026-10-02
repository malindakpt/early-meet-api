import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { Difficulty, QuestionStatus, type Question, type Prisma } from '@prisma/client';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { TechnologySegmentService } from '../technology-segments/technology-segment.service.js';
import { TechnologyService } from '../technologies/technology.service.js';
import type { CreateQuestionDto } from './dto/create-question.dto.js';
import type { QueryQuestionsDto } from './dto/query-questions.dto.js';
import type { UpdateQuestionDto } from './dto/update-question.dto.js';
import type {
  IQuestionCsvImportPreview,
  IQuestionCsvImportResult,
  IQuestionCsvImportRow,
  IQuestionCsvImportRowError,
} from './question-csv-import.types.js';

const DEFAULT_QUESTION_TYPE = 'GENERAL';
const MAX_CSV_IMPORT_ROWS = 50;
const CSV_HEADERS = [
  'question',
  'technology',
  'technologySegment',
  'difficulty',
  'estimatedAnswerTimeSeconds',
  'evaluationCriteria',
  'allowFollowUp',
] as const;

type CsvValues = Record<(typeof CSV_HEADERS)[number], string>;

export interface IQuestionManagementResponse extends Question {
  createdByUser: { name: string } | null;
}

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly technologyService: TechnologyService,
    private readonly technologySegmentService: TechnologySegmentService,
  ) {}

  async create(user: IAuthenticatedUser, dto: CreateQuestionDto): Promise<Question> {
    await this.assertValidTechnologySegment(dto.technologyId, dto.technologySegmentId);
    const data: Prisma.QuestionUncheckedCreateInput = {
      ...dto,
      createdByUserId: user.id,
      questionType: dto.questionType ?? DEFAULT_QUESTION_TYPE,
      status: QuestionStatus.APPROVED,
    };
    return this.prisma.question.create({ data });
  }

  async findAll(
    user: IAuthenticatedUser,
    query: QueryQuestionsDto,
  ): Promise<IQuestionManagementResponse[]> {
    return this.prisma.question.findMany({
      where: {
        ...this.toQuestionWhere(query),
        ...(user.role === 'PLATFORM_ADMIN' ? {} : { status: QuestionStatus.APPROVED }),
        ...(query.search === undefined
          ? {}
          : { questionText: { contains: query.search, mode: 'insensitive' } }),
      },
      include: { createdByUser: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async previewCsvImport(csv: string): Promise<IQuestionCsvImportPreview> {
    const assessment = await this.assessCsvImport(csv);
    return {
      errors: assessment.errors,
      rows: assessment.rows,
      totalRows: assessment.totalRows,
      validRows: assessment.rows.length,
    };
  }

  async importCsv(user: IAuthenticatedUser, csv: string): Promise<IQuestionCsvImportResult> {
    const assessment = await this.assessCsvImport(csv);
    if (assessment.errors.length > 0) {
      throw new UnprocessableEntityException('The CSV contains invalid question rows.');
    }
    const result = await this.prisma.$transaction((transaction) =>
      transaction.question.createMany({
        data: assessment.rows.map((row) => ({
          difficulty: row.difficulty,
          estimatedAnswerTimeSeconds: row.estimatedAnswerTimeSeconds,
          evaluationCriteria: row.evaluationCriteria,
          followUpAllowed: row.allowFollowUp,
          metaData: {},
          questionText: row.question,
          questionType: DEFAULT_QUESTION_TYPE,
          createdByUserId: user.id,
          status: QuestionStatus.APPROVED,
          technologyId: row.technologyId,
          technologySegmentId: row.technologySegmentId,
        })),
      }),
    );
    return { importedCount: result.count };
  }

  async findOne(questionId: string): Promise<Question> {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (question === null) {
      throw new NotFoundException('Question not found.');
    }
    return question;
  }

  async findEligibleForVacancyGeneration(
    technologyIds: string[],
    difficulty: Difficulty,
  ): Promise<Question[]> {
    return this.prisma.question.findMany({
      where: {
        technologyId: { in: technologyIds },
        difficulty,
        status: QuestionStatus.APPROVED,
      },
      orderBy: [{ technologyId: 'asc' }, { technologySegmentId: 'asc' }, { id: 'asc' }],
    });
  }

  async update(questionId: string, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(questionId);
    const technologyId = dto.technologyId ?? question.technologyId;
    const technologySegmentId = dto.technologySegmentId ?? question.technologySegmentId;
    await this.assertValidTechnologySegment(technologyId, technologySegmentId);

    const data: Prisma.QuestionUncheckedUpdateInput = { ...dto };
    return this.prisma.question.update({ where: { id: questionId }, data });
  }

  async approve(questionId: string): Promise<Question> {
    const question = await this.findOne(questionId);
    if (question.status !== QuestionStatus.PENDING) {
      throw new ConflictException('Only pending questions can be approved.');
    }
    return this.transitionStatus(questionId, QuestionStatus.APPROVED);
  }

  async archive(questionId: string): Promise<Question> {
    const question = await this.findOne(questionId);
    if (question.status === QuestionStatus.ARCHIVED) {
      throw new ConflictException('This question is already archived.');
    }
    return this.transitionStatus(questionId, QuestionStatus.ARCHIVED);
  }

  async createPending(
    user: IAuthenticatedUser,
    dto: {
      difficulty: Difficulty;
      estimatedAnswerTimeSeconds: number;
      evaluationCriteria: Prisma.InputJsonObject;
      followUpAllowed: boolean;
      questionText: string;
      technologyId: string;
      technologySegmentId: string;
    },
    transaction: Prisma.TransactionClient,
  ): Promise<Question> {
    await this.assertValidTechnologySegment(dto.technologyId, dto.technologySegmentId);
    return transaction.question.create({
      data: {
        ...dto,
        createdByUserId: user.id,
        metaData: {},
        questionType: DEFAULT_QUESTION_TYPE,
        status: QuestionStatus.PENDING,
      },
    });
  }

  async searchApproved(query: QueryQuestionsDto): Promise<{ items: Question[]; total: number }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.QuestionWhereInput = {
      ...this.toQuestionWhere(query),
      status: QuestionStatus.APPROVED,
      ...(query.search === undefined
        ? {}
        : { questionText: { contains: query.search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);
    return { items, total };
  }

  private async assertValidTechnologySegment(
    technologyId: string,
    technologySegmentId: string,
  ): Promise<void> {
    await this.technologyService.findOne(technologyId);
    await this.technologySegmentService.findOne(technologyId, technologySegmentId);
  }

  private toQuestionWhere(query: QueryQuestionsDto): Prisma.QuestionWhereInput {
    return {
      technologyId:
        query.technologyIds === undefined || query.technologyIds.length === 0
          ? query.technologyId
          : { in: query.technologyIds },
      technologySegmentId: query.technologySegmentId,
      difficulty: query.difficulty,
      questionType: query.questionType,
      status: query.status,
    };
  }

  private async transitionStatus(questionId: string, status: QuestionStatus): Promise<Question> {
    return this.prisma.question.update({ where: { id: questionId }, data: { status } });
  }

  private async assessCsvImport(csv: string): Promise<{
    errors: IQuestionCsvImportRowError[];
    rows: Array<IQuestionCsvImportRow & { technologyId: string; technologySegmentId: string }>;
    totalRows: number;
  }> {
    const records = this.parseCsv(csv);
    const errors: IQuestionCsvImportRowError[] = [];
    if (records.length > MAX_CSV_IMPORT_ROWS) {
      return {
        errors: [{ message: 'Bulk import is limited to 50 questions per CSV.', row: 1 }],
        rows: [],
        totalRows: records.length,
      };
    }
    const [technologies, segments] = await Promise.all([
      this.technologyService.findAll(),
      this.technologySegmentService.findAllAcrossTechnologies(),
    ]);
    const technologyByName = new Map(
      technologies.map((technology) => [technology.name.trim(), technology]),
    );
    const segmentByTechnologyAndName = new Map(
      segments.map((segment) => [`${segment.technologyId}\u0000${segment.name.trim()}`, segment]),
    );
    const questions = new Set<string>();
    const rows: Array<
      IQuestionCsvImportRow & { technologyId: string; technologySegmentId: string }
    > = [];
    for (const [recordIndex, record] of records.entries()) {
      const row = recordIndex + 2;
      const values = Object.fromEntries(
        CSV_HEADERS.map((header, index) => [header, record[index]?.trim() ?? '']),
      ) as CsvValues;
      const question = values.question;
      const technology = technologyByName.get(values.technology);
      const questionErrors = this.validateCsvRow(values, row, questions);
      if (technology === undefined && values.technology.length > 0) {
        questionErrors.push({
          field: 'technology',
          message: `Technology "${values.technology}" was not found.`,
          row,
        });
      }
      const segment =
        technology === undefined
          ? undefined
          : segmentByTechnologyAndName.get(`${technology.id}\u0000${values.technologySegment}`);
      if (
        technology !== undefined &&
        segment === undefined &&
        values.technologySegment.length > 0
      ) {
        questionErrors.push({
          field: 'technologySegment',
          message: `Technology Segment "${values.technologySegment}" does not belong to Technology "${values.technology}".`,
          row,
        });
      }
      if (questionErrors.length > 0 || technology === undefined || segment === undefined) {
        errors.push(...questionErrors);
        continue;
      }
      rows.push({
        allowFollowUp: values.allowFollowUp.toLowerCase() === 'true',
        difficulty: values.difficulty as Difficulty,
        estimatedAnswerTimeSeconds: Number(values.estimatedAnswerTimeSeconds),
        evaluationCriteria: JSON.parse(values.evaluationCriteria) as Prisma.InputJsonObject,
        question,
        row,
        technology: technology.name,
        technologyId: technology.id,
        technologySegment: segment.name,
        technologySegmentId: segment.id,
      });
    }
    return { errors, rows, totalRows: records.length };
  }

  private parseCsv(csv: string): string[][] {
    let records: string[][];
    try {
      records = parse(csv, {
        bom: true,
        relax_column_count: false,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error: unknown) {
      throw new UnprocessableEntityException('The CSV file is malformed.', { cause: error });
    }
    if (records.length === 0) throw new UnprocessableEntityException('The CSV file is empty.');
    const headers = records[0];
    if (headers === undefined) throw new UnprocessableEntityException('The CSV file is empty.');
    const uniqueHeaders = new Set(headers);
    for (const header of headers) {
      if (!CSV_HEADERS.includes(header as (typeof CSV_HEADERS)[number])) {
        throw new UnprocessableEntityException(`Unexpected column: ${header}`);
      }
    }
    if (headers.length !== CSV_HEADERS.length || uniqueHeaders.size !== headers.length) {
      throw new UnprocessableEntityException('CSV headers must match the required format.');
    }
    if (CSV_HEADERS.some((header, index) => headers[index] !== header)) {
      throw new UnprocessableEntityException(`CSV headers must be: ${CSV_HEADERS.join(',')}`);
    }
    if (records.length === 1)
      throw new UnprocessableEntityException('The CSV file has no question rows.');
    return records.slice(1);
  }

  private validateCsvRow(
    values: CsvValues,
    row: number,
    questions: Set<string>,
  ): IQuestionCsvImportRowError[] {
    const errors: IQuestionCsvImportRowError[] = [];
    const requiredFields: Array<keyof CsvValues> = [
      'question',
      'technology',
      'technologySegment',
      'difficulty',
      'estimatedAnswerTimeSeconds',
      'evaluationCriteria',
      'allowFollowUp',
    ];
    for (const field of requiredFields) {
      if (values[field].length === 0)
        errors.push({ field, message: 'This field is required.', row });
    }
    if (values.question.length > 0) {
      if (questions.has(values.question))
        errors.push({ field: 'question', message: 'Duplicate question found within CSV.', row });
      questions.add(values.question);
    }
    if (!Object.values(Difficulty).includes(values.difficulty as Difficulty)) {
      errors.push({
        field: 'difficulty',
        message: `Invalid difficulty "${values.difficulty}".`,
        row,
      });
    }
    const estimatedAnswerTimeSeconds = Number(values.estimatedAnswerTimeSeconds);
    if (
      !Number.isInteger(estimatedAnswerTimeSeconds) ||
      estimatedAnswerTimeSeconds < 30 ||
      estimatedAnswerTimeSeconds > 900
    ) {
      errors.push({
        field: 'estimatedAnswerTimeSeconds',
        message: 'Estimated answer time must be a whole number of seconds between 30 and 900.',
        row,
      });
    }
    if (!['true', 'false'].includes(values.allowFollowUp.toLowerCase())) {
      errors.push({ field: 'allowFollowUp', message: 'allowFollowUp must be true or false.', row });
    }
    try {
      const value: unknown = JSON.parse(values.evaluationCriteria);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error();
    } catch {
      errors.push({
        field: 'evaluationCriteria',
        message: 'Evaluation criteria must be a JSON object.',
        row,
      });
    }
    return errors;
  }
}
