import { ConfigService } from '@nestjs/config';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import type { ITechnologyMatchResult, IVacancyTechnologyForMatching } from './technology-matching.service.js';
export declare class MatchScoreCalculatorService {
    private readonly config;
    constructor(config: ConfigService<IEnvironmentVariables, true>);
    calculateForVacancy(matches: ITechnologyMatchResult, vacancyTechnologies: IVacancyTechnologyForMatching[]): number;
    calculate(matchedRequired: number, totalRequired: number, matchedPreferred: number, totalPreferred: number): number;
}
