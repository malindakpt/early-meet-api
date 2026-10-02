import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { VacancyAssessmentSuggestionService, type IExperienceCompetencyGenerationResponse } from './vacancy-assessment-suggestion.service.js';
import { VacancyAssessmentSuggestionScheduler } from './vacancy-assessment-suggestion-scheduler.service.js';
export declare class VacancyAssessmentSuggestionController {
    private readonly vacancyAssessmentSuggestionService;
    private readonly vacancyAssessmentSuggestionScheduler;
    constructor(vacancyAssessmentSuggestionService: VacancyAssessmentSuggestionService, vacancyAssessmentSuggestionScheduler: VacancyAssessmentSuggestionScheduler);
    suggest(user: IAuthenticatedUser, vacancyId: string): Promise<IExperienceCompetencyGenerationResponse>;
    findCurrent(user: IAuthenticatedUser, vacancyId: string): Promise<IExperienceCompetencyGenerationResponse | null>;
}
