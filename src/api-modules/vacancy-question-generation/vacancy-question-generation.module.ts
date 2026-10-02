import { Module } from '@nestjs/common';

import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';
import { QuestionModule } from '../questions/question.module.js';
import { VacancyTechnologyModule } from '../vacancy-technologies/vacancy-technology.module.js';
import { VacancyModule } from '../vacancies/vacancy.module.js';
import { VacancyQuestionGenerationController } from './vacancy-question-generation.controller.js';
import { VacancyAssessmentSuggestionController } from './vacancy-assessment-suggestion.controller.js';
import { VacancyAssessmentSuggestionService } from './vacancy-assessment-suggestion.service.js';
import { VacancyAssessmentSuggestionScheduler } from './vacancy-assessment-suggestion-scheduler.service.js';
import { VacancyExperienceCompetencyController } from './vacancy-experience-competency.controller.js';
import { VacancyExperienceCompetencyService } from './vacancy-experience-competency.service.js';
import { VacancyQuestionGenerationService } from './vacancy-question-generation.service.js';
import { VacancyQuestionSetController } from './vacancy-question-set.controller.js';
import { VacancyQuestionSetService } from './vacancy-question-set.service.js';

@Module({
  imports: [AiModule, AuthModule, QuestionModule, VacancyModule, VacancyTechnologyModule],
  controllers: [
    VacancyQuestionGenerationController,
    VacancyQuestionSetController,
    VacancyAssessmentSuggestionController,
    VacancyExperienceCompetencyController,
  ],
  providers: [
    VacancyQuestionGenerationService,
    VacancyQuestionSetService,
    VacancyAssessmentSuggestionService,
    VacancyAssessmentSuggestionScheduler,
    VacancyExperienceCompetencyService,
    StructuredLogger,
  ],
  exports: [VacancyQuestionSetService],
})
export class VacancyQuestionGenerationModule {}
