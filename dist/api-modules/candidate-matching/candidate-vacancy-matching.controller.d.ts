import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import type { IVacancyCandidateResponse } from '../vacancy-candidates/vacancy-candidate.service.js';
import { CandidateVacancyMatchingService } from './candidate-vacancy-matching.service.js';
import { RequestAiMatchDto } from './dto/request-ai-match.dto.js';
export declare class CandidateVacancyMatchingController {
    private readonly matchingService;
    constructor(matchingService: CandidateVacancyMatchingService);
    match(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): Promise<IVacancyCandidateResponse>;
}
export declare class CandidateVacancyAiMatchController {
    private readonly matchingService;
    constructor(matchingService: CandidateVacancyMatchingService);
    requestAiMatch(user: IAuthenticatedUser, vacancyId: string, dto: RequestAiMatchDto): Promise<{
        queuedCandidateIds: string[];
    }>;
}
