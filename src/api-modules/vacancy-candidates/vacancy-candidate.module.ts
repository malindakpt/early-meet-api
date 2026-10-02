import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CandidateModule } from '../candidates/candidate.module.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { VacancyModule } from '../vacancies/vacancy.module.js';
import { VacancyTechnologyModule } from '../vacancy-technologies/vacancy-technology.module.js';
import { CandidateRankingService } from './candidate-ranking.service.js';
import { PublicApplicationController } from './public-application.controller.js';
import { VacancyCandidateController } from './vacancy-candidate.controller.js';
import { VacancyCandidateService } from './vacancy-candidate.service.js';

@Module({
  imports: [AuthModule, CandidateModule, VacancyModule, VacancyTechnologyModule],
  controllers: [PublicApplicationController, VacancyCandidateController],
  providers: [CandidateRankingService, StructuredLogger, VacancyCandidateService],
  exports: [VacancyCandidateService],
})
export class VacancyCandidateModule {}
