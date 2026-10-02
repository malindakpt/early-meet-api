import { type Question, type VacancyCustomQuestion, type VacancyQuestion } from '@prisma/client';
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
export interface IVacancyQuestionResponse extends VacancyQuestion {
    estimatedAnswerTimeSeconds: number;
}
export type IVacancyCustomQuestionResponse = VacancyCustomQuestion;
export declare class VacancyQuestionSetService {
    private readonly prisma;
    private readonly vacancyService;
    private readonly vacancyTechnologyService;
    private readonly questionService;
    constructor(prisma: PrismaService, vacancyService: VacancyService, vacancyTechnologyService: VacancyTechnologyService, questionService: QuestionService);
    findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyQuestionResponse[]>;
    add(user: IAuthenticatedUser, vacancyId: string, dto: AddVacancyQuestionDto): Promise<IVacancyQuestionResponse>;
    findAvailable(user: IAuthenticatedUser, vacancyId: string, query: QueryQuestionsDto): Promise<{
        items: Array<Question & {
            alreadyAdded: boolean;
        }>;
        page: number;
        pageSize: number;
        total: number;
    }>;
    findAllCustom(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyCustomQuestionResponse[]>;
    createCustom(user: IAuthenticatedUser, vacancyId: string, dto: CreateVacancyCustomQuestionDto): Promise<IVacancyCustomQuestionResponse>;
    updateCustom(user: IAuthenticatedUser, vacancyId: string, customQuestionId: string, dto: UpdateVacancyCustomQuestionDto): Promise<IVacancyCustomQuestionResponse>;
    removeCustom(user: IAuthenticatedUser, vacancyId: string, customQuestionId: string): Promise<void>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyQuestionId: string, dto: UpdateVacancyQuestionDto): Promise<IVacancyQuestionResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string, vacancyQuestionId: string): Promise<void>;
    private findOne;
    private findCustom;
    private createSnapshot;
    private reorder;
    private reorderCustom;
    private replaceSequences;
    private replaceCustomOrders;
    private toInputJsonValue;
    private toResponse;
}
