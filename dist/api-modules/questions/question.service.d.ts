import { Difficulty, type Question, type Prisma } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { TechnologySegmentService } from '../technology-segments/technology-segment.service.js';
import { TechnologyService } from '../technologies/technology.service.js';
import type { CreateQuestionDto } from './dto/create-question.dto.js';
import type { QueryQuestionsDto } from './dto/query-questions.dto.js';
import type { UpdateQuestionDto } from './dto/update-question.dto.js';
import type { IQuestionCsvImportPreview, IQuestionCsvImportResult } from './question-csv-import.types.js';
export interface IQuestionManagementResponse extends Question {
    createdByUser: {
        name: string;
    } | null;
}
export declare class QuestionService {
    private readonly prisma;
    private readonly technologyService;
    private readonly technologySegmentService;
    constructor(prisma: PrismaService, technologyService: TechnologyService, technologySegmentService: TechnologySegmentService);
    create(user: IAuthenticatedUser, dto: CreateQuestionDto): Promise<Question>;
    findAll(user: IAuthenticatedUser, query: QueryQuestionsDto): Promise<IQuestionManagementResponse[]>;
    previewCsvImport(csv: string): Promise<IQuestionCsvImportPreview>;
    importCsv(user: IAuthenticatedUser, csv: string): Promise<IQuestionCsvImportResult>;
    findOne(questionId: string): Promise<Question>;
    findEligibleForVacancyGeneration(technologyIds: string[], difficulty: Difficulty): Promise<Question[]>;
    update(questionId: string, dto: UpdateQuestionDto): Promise<Question>;
    approve(questionId: string): Promise<Question>;
    archive(questionId: string): Promise<Question>;
    createPending(user: IAuthenticatedUser, dto: {
        difficulty: Difficulty;
        estimatedAnswerTimeSeconds: number;
        evaluationCriteria: Prisma.InputJsonObject;
        followUpAllowed: boolean;
        questionText: string;
        technologyId: string;
        technologySegmentId: string;
    }, transaction: Prisma.TransactionClient): Promise<Question>;
    searchApproved(query: QueryQuestionsDto): Promise<{
        items: Question[];
        total: number;
    }>;
    private assertValidTechnologySegment;
    private toQuestionWhere;
    private transitionStatus;
    private assessCsvImport;
    private parseCsv;
    private validateCsvRow;
}
