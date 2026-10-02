import { Inject, Injectable } from '@nestjs/common';

import {
  CANDIDATE_EVALUATION_LLM_SERVICE,
  type ICandidateEvaluationInput,
  type ICandidateEvaluationLlmService,
} from '../ai/candidate-evaluation.types.js';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { VacancyCandidateService } from '../vacancy-candidates/vacancy-candidate.service.js';
import { VacancyTechnologyService } from '../vacancy-technologies/vacancy-technology.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import { MatchScoreCalculatorService } from './match-score-calculator.service.js';
import { TechnologyMatchingService } from './technology-matching.service.js';

// HR-triggered AI CV match. CV upload performs no AI work, so this workflow both extracts the
// candidate's CV data and evaluates it against the vacancy in a single model call.
@Injectable()
export class CandidateVacancyEvaluationService {
  constructor(
    @Inject(CANDIDATE_EVALUATION_LLM_SERVICE)
    private readonly evaluationLlmService: ICandidateEvaluationLlmService,
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly vacancyService: VacancyService,
    private readonly vacancyTechnologyService: VacancyTechnologyService,
    private readonly technologyMatchingService: TechnologyMatchingService,
    private readonly scoreCalculator: MatchScoreCalculatorService,
    private readonly logger: StructuredLogger,
  ) {}

  claim(vacancyCandidateId: string): Promise<boolean> {
    return this.vacancyCandidateService.claimAiMatch(vacancyCandidateId);
  }

  fail(vacancyCandidateId: string): Promise<void> {
    return this.vacancyCandidateService.failAiMatch(vacancyCandidateId);
  }

  async process(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<void> {
    const vacancyCandidate = await this.vacancyCandidateService.findOne(
      user,
      vacancyId,
      vacancyCandidateId,
    );
    const [vacancy, cvText, vacancyTechnologies] = await Promise.all([
      this.vacancyService.findOne(user, vacancyId),
      this.vacancyCandidateService.getCvTextForAiMatch(vacancyCandidateId),
      this.vacancyTechnologyService.findAll(user, vacancyId),
    ]);
    const evaluation = await this.evaluationLlmService.evaluate(
      this.buildEvaluationInput(vacancy, cvText, vacancyTechnologies),
    );
    // Required/preferred technology coverage keeps the existing deterministic canonical-name
    // rules, applied to the freshly extracted CV data rather than asked of the model.
    const technologies = vacancyTechnologies.map((vacancyTechnology) => ({
      name: vacancyTechnology.technology.name,
      requirementType: vacancyTechnology.requirementType,
    }));
    const technologyMatches = this.technologyMatchingService.matchExtractedCv(
      evaluation.cv,
      technologies,
    );
    await this.vacancyCandidateService.completeAiMatch(vacancyCandidateId, {
      extractedData: evaluation.cv,
      gaps: evaluation.missingRequirements,
      preferredTechnologiesMet: technologyMatches.preferredTechnologiesMet,
      requiredTechnologiesMet: technologyMatches.requiredTechnologiesMet,
      score: evaluation.score,
      strengths: evaluation.matchedRequirements,
      summary: evaluation.summary,
      vacancyMatchScore: this.scoreCalculator.calculateForVacancy(technologyMatches, technologies),
    });
    this.logger.log('Candidate vacancy evaluation completed', {
      event: 'candidate_vacancy.evaluation.completed',
      vacancyId,
      vacancyCandidateId,
      candidateId: vacancyCandidate.candidateId,
    });
  }

  private buildEvaluationInput(
    vacancy: Awaited<ReturnType<VacancyService['findOne']>>,
    cvText: string,
    vacancyTechnologies: Awaited<ReturnType<VacancyTechnologyService['findAll']>>,
  ): ICandidateEvaluationInput {
    return {
      cvText,
      vacancy: {
        title: vacancy.title,
        description: vacancy.jobDescription,
        experienceMin: vacancy.experienceMin,
        experienceMax: vacancy.experienceMax,
        employmentType: vacancy.employmentType,
        workType: vacancy.workType,
        technologies: vacancyTechnologies.map((vacancyTechnology) => ({
          name: vacancyTechnology.technology.name,
          requirementType: vacancyTechnology.requirementType,
          segments: vacancyTechnology.segments.map((segment) => segment.name),
        })),
      },
    };
  }
}
