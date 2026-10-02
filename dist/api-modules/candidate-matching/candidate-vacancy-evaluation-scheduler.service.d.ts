import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { CandidateVacancyEvaluationService } from './candidate-vacancy-evaluation.service.js';
export declare class CandidateVacancyEvaluationScheduler {
    private readonly evaluationService;
    private readonly logger;
    private readonly scheduledCandidateIds;
    constructor(evaluationService: CandidateVacancyEvaluationService, logger: StructuredLogger);
    schedule(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): void;
    private process;
}
