import { type ICandidateEvaluationLlmService } from '../ai/candidate-evaluation.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import { MatchScoreCalculatorService } from './match-score-calculator.service.js';
import { TechnologyMatchingService } from './technology-matching.service.js';
export declare class CandidateVacancyEvaluationService {
    private readonly evaluationLlmService;
    private readonly vacancyCandidateService;
    private readonly vacancyService;
    private readonly vacancyTechnologyService;
    private readonly technologyMatchingService;
    private readonly scoreCalculator;
    private readonly logger;
    constructor(evaluationLlmService: ICandidateEvaluationLlmService, vacancyCandidateService: VacancyCandidateService, vacancyService: VacancyService, vacancyTechnologyService: VacancyTechnologyService, technologyMatchingService: TechnologyMatchingService, scoreCalculator: MatchScoreCalculatorService, logger: StructuredLogger);
    claim(vacancyCandidateId: string): Promise<boolean>;
    fail(vacancyCandidateId: string): Promise<void>;
    process(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<void>;
    private buildEvaluationInput;
}
