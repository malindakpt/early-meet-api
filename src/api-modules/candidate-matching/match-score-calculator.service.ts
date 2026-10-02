import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import type {
  ITechnologyMatchResult,
  IVacancyTechnologyForMatching,
} from './technology-matching.service.js';

@Injectable()
export class MatchScoreCalculatorService {
  constructor(private readonly config: ConfigService<IEnvironmentVariables, true>) {}

  calculateForVacancy(
    matches: ITechnologyMatchResult,
    vacancyTechnologies: IVacancyTechnologyForMatching[],
  ): number {
    const totalRequired = vacancyTechnologies.filter(
      (technology) => technology.requirementType === 'REQUIRED',
    ).length;
    return this.calculate(
      matches.requiredTechnologiesMet.length,
      totalRequired,
      matches.preferredTechnologiesMet.length,
      vacancyTechnologies.length - totalRequired,
    );
  }

  calculate(
    matchedRequired: number,
    totalRequired: number,
    matchedPreferred: number,
    totalPreferred: number,
  ): number {
    const requiredWeight =
      totalRequired > 0 ? this.config.getOrThrow('MATCH_REQUIRED_TECHNOLOGY_WEIGHT') : 0;
    const preferredWeight =
      totalPreferred > 0 ? this.config.getOrThrow('MATCH_PREFERRED_TECHNOLOGY_WEIGHT') : 0;
    const totalWeight = requiredWeight + preferredWeight;
    if (totalWeight === 0) {
      return 0;
    }

    const requiredCoverage = totalRequired === 0 ? 0 : matchedRequired / totalRequired;
    const preferredCoverage = totalPreferred === 0 ? 0 : matchedPreferred / totalPreferred;
    const score =
      ((requiredCoverage * requiredWeight + preferredCoverage * preferredWeight) / totalWeight) *
      100;
    return Number(score.toFixed(2));
  }
}
