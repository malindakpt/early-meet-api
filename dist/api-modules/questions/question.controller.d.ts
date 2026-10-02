import type { Question as QuestionModel } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { AuthService } from '../auth/auth.service.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { QuestionCsvImportDto, QuestionCsvPreviewDto } from './dto/question-csv-import.dto.js';
import { QueryQuestionsDto } from './dto/query-questions.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import type { IQuestionCsvImportPreview, IQuestionCsvImportResult } from './question-csv-import.types.js';
import { QuestionService, type IQuestionManagementResponse } from './question.service.js';
export declare class QuestionController {
    private readonly questionService;
    private readonly authService;
    constructor(questionService: QuestionService, authService: AuthService);
    create(user: IAuthenticatedUser, dto: CreateQuestionDto): Promise<QuestionModel>;
    previewImport(dto: QuestionCsvPreviewDto): Promise<IQuestionCsvImportPreview>;
    import(dto: QuestionCsvImportDto, user: IAuthenticatedUser): Promise<IQuestionCsvImportResult>;
    findAll(user: IAuthenticatedUser, query: QueryQuestionsDto): Promise<IQuestionManagementResponse[]>;
    findOne(questionId: string): Promise<QuestionModel>;
    update(questionId: string, dto: UpdateQuestionDto): Promise<QuestionModel>;
    approve(questionId: string): Promise<QuestionModel>;
    archive(questionId: string): Promise<QuestionModel>;
}
