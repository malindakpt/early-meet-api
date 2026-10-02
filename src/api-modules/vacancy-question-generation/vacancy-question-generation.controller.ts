import { Controller, Param, Post, UseGuards } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import {
  type IGenerateVacancyQuestionsResponse,
  VacancyQuestionGenerationService,
} from './vacancy-question-generation.service.js';

@Controller('vacancies/:vacancyId/questions')
@UseGuards(AuthenticationGuard)
export class VacancyQuestionGenerationController {
  constructor(
    private readonly vacancyQuestionGenerationService: VacancyQuestionGenerationService,
  ) {}

  @Post('generate')
  async generate(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IGenerateVacancyQuestionsResponse> {
    return this.vacancyQuestionGenerationService.generate(user, vacancyId);
  }
}
