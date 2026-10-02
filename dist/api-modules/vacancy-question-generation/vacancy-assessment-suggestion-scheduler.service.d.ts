import { VacancyAssessmentSuggestionService } from './vacancy-assessment-suggestion.service.js';
export declare class VacancyAssessmentSuggestionScheduler {
    private readonly suggestionService;
    private activeCount;
    private readonly queuedGenerationIds;
    constructor(suggestionService: VacancyAssessmentSuggestionService);
    schedule(generationId: string): void;
    private startNext;
}
