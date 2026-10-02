import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { VacancyCandidateModule } from '../vacancy-candidates/vacancy-candidate.module.js';
import { VacancyTechnologyModule } from '../vacancy-technologies/vacancy-technology.module.js';
import { VacancyModule } from '../vacancies/vacancy.module.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import {
  CandidateVacancyAiMatchController,
  CandidateVacancyMatchingController,
} from './candidate-vacancy-matching.controller.js';
import { CandidateVacancyEvaluationScheduler } from './candidate-vacancy-evaluation-scheduler.service.js';
import { CandidateVacancyEvaluationService } from './candidate-vacancy-evaluation.service.js';
import { CandidateVacancyMatchingService } from './candidate-vacancy-matching.service.js';
import { MatchScoreCalculatorService } from './match-score-calculator.service.js';
import { TechnologyMatchingService } from './technology-matching.service.js';

@Module({
  imports: [AiModule, AuthModule, VacancyCandidateModule, VacancyTechnologyModule, VacancyModule],
  controllers: [CandidateVacancyAiMatchController, CandidateVacancyMatchingController],
  providers: [
    StructuredLogger,
    CandidateVacancyEvaluationScheduler,
    CandidateVacancyEvaluationService,
    CandidateVacancyMatchingService,
    MatchScoreCalculatorService,
    TechnologyMatchingService,
  ],
})
export class CandidateVacancyMatchingModule {}
