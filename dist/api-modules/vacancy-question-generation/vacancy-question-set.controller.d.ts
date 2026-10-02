import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { AddVacancyQuestionDto } from './dto/add-vacancy-question.dto.js';
import { CreateVacancyCustomQuestionDto } from './dto/create-vacancy-custom-question.dto.js';
import { UpdateVacancyQuestionDto } from './dto/update-vacancy-question.dto.js';
import { UpdateVacancyCustomQuestionDto } from './dto/update-vacancy-custom-question.dto.js';
import { QueryQuestionsDto } from '../questions/dto/query-questions.dto.js';
import { VacancyQuestionSetService, type IVacancyCustomQuestionResponse, type IVacancyQuestionResponse } from './vacancy-question-set.service.js';
export declare class VacancyQuestionSetController {
    private readonly vacancyQuestionSetService;
    constructor(vacancyQuestionSetService: VacancyQuestionSetService);
    findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyQuestionResponse[]>;
    findAvailable(user: IAuthenticatedUser, vacancyId: string, query: QueryQuestionsDto): Promise<{
        items: Array<import("@prisma/client").Question & {
            alreadyAdded: boolean;
        }>;
        page: number;
        pageSize: number;
        total: number;
    }>;
    add(user: IAuthenticatedUser, vacancyId: string, dto: AddVacancyQuestionDto): Promise<IVacancyQuestionResponse>;
    findAllCustom(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyCustomQuestionResponse[]>;
    createCustom(user: IAuthenticatedUser, vacancyId: string, dto: CreateVacancyCustomQuestionDto): Promise<IVacancyCustomQuestionResponse>;
    updateCustom(user: IAuthenticatedUser, vacancyId: string, customQuestionId: string, dto: UpdateVacancyCustomQuestionDto): Promise<IVacancyCustomQuestionResponse>;
    removeCustom(user: IAuthenticatedUser, vacancyId: string, customQuestionId: string): Promise<void>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyQuestionId: string, dto: UpdateVacancyQuestionDto): Promise<IVacancyQuestionResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string, vacancyQuestionId: string): Promise<void>;
}
