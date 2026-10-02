import { Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import {
  VacancyAssessmentSuggestionService,
  type IExperienceCompetencyGenerationResponse,
} from './vacancy-assessment-suggestion.service.js';
import { VacancyAssessmentSuggestionScheduler } from './vacancy-assessment-suggestion-scheduler.service.js';

@Controller('vacancies/:vacancyId/assessment-area-suggestions')
@UseGuards(AuthenticationGuard)
export class VacancyAssessmentSuggestionController {
  constructor(
    private readonly vacancyAssessmentSuggestionService: VacancyAssessmentSuggestionService,
    private readonly vacancyAssessmentSuggestionScheduler: VacancyAssessmentSuggestionScheduler,
  ) {}

  @Post()
  @HttpCode(202)
  async suggest(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IExperienceCompetencyGenerationResponse> {
    const generation = await this.vacancyAssessmentSuggestionService.start(user, vacancyId);
    this.vacancyAssessmentSuggestionScheduler.schedule(generation.generationId);
    return generation;
  }

  @Get()
  async findCurrent(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IExperienceCompetencyGenerationResponse | null> {
    return this.vacancyAssessmentSuggestionService.findCurrent(user, vacancyId);
  }
}
