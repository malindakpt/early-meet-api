import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { type IVacancyCandidateResponse, VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { CandidateVacancyEvaluationScheduler } from './candidate-vacancy-evaluation-scheduler.service.js';
import { MatchScoreCalculatorService } from './match-score-calculator.service.js';
import { TechnologyMatchingService } from './technology-matching.service.js';
export declare class CandidateVacancyMatchingService {
    private readonly vacancyCandidateService;
    private readonly vacancyTechnologyService;
    private readonly technologyMatchingService;
    private readonly scoreCalculator;
    private readonly evaluationScheduler;
    private readonly logger;
    constructor(vacancyCandidateService: VacancyCandidateService, vacancyTechnologyService: VacancyTechnologyService, technologyMatchingService: TechnologyMatchingService, scoreCalculator: MatchScoreCalculatorService, evaluationScheduler: CandidateVacancyEvaluationScheduler, logger: StructuredLogger);
    match(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IVacancyCandidateResponse>;
    requestAiMatches(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateIds: string[]): Promise<{
        queuedCandidateIds: string[];
    }>;
}
