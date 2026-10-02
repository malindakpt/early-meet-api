import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { type IGenerateVacancyQuestionsResponse, VacancyQuestionGenerationService } from './vacancy-question-generation.service.js';
export declare class VacancyQuestionGenerationController {
    private readonly vacancyQuestionGenerationService;
    constructor(vacancyQuestionGenerationService: VacancyQuestionGenerationService);
    generate(user: IAuthenticatedUser, vacancyId: string): Promise<IGenerateVacancyQuestionsResponse>;
}
