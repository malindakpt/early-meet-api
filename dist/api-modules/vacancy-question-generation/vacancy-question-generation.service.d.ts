import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
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
export declare class VacancyQuestionGenerationService {
    private readonly prisma;
    private readonly vacancyService;
    private readonly vacancyTechnologyService;
    private readonly questionService;
    constructor(prisma: PrismaService, vacancyService: VacancyService, vacancyTechnologyService: VacancyTechnologyService, questionService: QuestionService);
    generate(user: IAuthenticatedUser, vacancyId: string): Promise<IGenerateVacancyQuestionsResponse>;
    private orderQuestions;
    private findRequirementType;
    private roundRobin;
    private toInputJsonValue;
    private rethrowConcurrentGeneration;
}
