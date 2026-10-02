import { Injectable } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import {
  type IVacancyCandidateResponse,
  VacancyCandidateService,
} from '../vacancy-candidates/vacancy-candidate.service.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { CandidateVacancyEvaluationScheduler } from './candidate-vacancy-evaluation-scheduler.service.js';
import { MatchScoreCalculatorService } from './match-score-calculator.service.js';
import { TechnologyMatchingService } from './technology-matching.service.js';

@Injectable()
export class CandidateVacancyMatchingService {
  constructor(
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly vacancyTechnologyService: VacancyTechnologyService,
    private readonly technologyMatchingService: TechnologyMatchingService,
    private readonly scoreCalculator: MatchScoreCalculatorService,
    private readonly evaluationScheduler: CandidateVacancyEvaluationScheduler,
    private readonly logger: StructuredLogger,
  ) {}

  async match(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<IVacancyCandidateResponse> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const extractedData =
      await this.vacancyCandidateService.getPersistedCvExtractedData(vacancyCandidateId);
    const vacancyTechnologies = await this.vacancyTechnologyService.findAll(user, vacancyId);
    const technologies = vacancyTechnologies.map((vacancyTechnology) => ({
      name: vacancyTechnology.technology.name,
      requirementType: vacancyTechnology.requirementType,
    }));
    const matches = this.technologyMatchingService.matchExtractedCv(extractedData, technologies);
    const score = this.scoreCalculator.calculateForVacancy(matches, technologies);
    const result = await this.vacancyCandidateService.update(user, vacancyId, vacancyCandidateId, {
      vacancyMatchScore: score,
      requiredTechnologiesMet: matches.requiredTechnologiesMet,
      preferredTechnologiesMet: matches.preferredTechnologiesMet,
    });
    this.logger.log('Candidate vacancy matching completed', {
      event: 'candidate_vacancy.matching.completed',
      vacancyId,
      vacancyCandidateId,
      candidateId: vacancyCandidate.candidateId,
      score,
    });
    return result;
  }

  async requestAiMatches(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateIds: string[],
  ): Promise<{ queuedCandidateIds: string[] }> {
    const queuedCandidateIds = await this.vacancyCandidateService.queueAiMatches(
      user,
      vacancyId,
      vacancyCandidateIds,
    );
    for (const vacancyCandidateId of queuedCandidateIds) {
      this.evaluationScheduler.schedule(user, vacancyId, vacancyCandidateId);
    }
    return { queuedCandidateIds };
  }
}
