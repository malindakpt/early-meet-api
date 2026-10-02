import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import type { IVacancyCandidateResponse } from '../vacancy-candidates/vacancy-candidate.service.js';
import { CandidateVacancyMatchingService } from './candidate-vacancy-matching.service.js';
import { RequestAiMatchDto } from './dto/request-ai-match.dto.js';

@Controller('vacancies/:vacancyId/candidates/:vacancyCandidateId/match')
@UseGuards(AuthenticationGuard)
export class CandidateVacancyMatchingController {
  constructor(private readonly matchingService: CandidateVacancyMatchingService) {}

  @Post()
  async match(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('vacancyCandidateId') vacancyCandidateId: string,
  ): Promise<IVacancyCandidateResponse> {
    return this.matchingService.match(user, vacancyId, vacancyCandidateId);
  }
}

@Controller('vacancies/:vacancyId/candidates/ai-match')
@UseGuards(AuthenticationGuard)
export class CandidateVacancyAiMatchController {
  constructor(private readonly matchingService: CandidateVacancyMatchingService) {}

  @Post()
  @HttpCode(202)
  async requestAiMatch(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: RequestAiMatchDto,
  ): Promise<{ queuedCandidateIds: string[] }> {
    return this.matchingService.requestAiMatches(user, vacancyId, dto.candidateIds);
  }
}
