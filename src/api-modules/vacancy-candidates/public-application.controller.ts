import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';

import { type IPublicApplicationResponse, VacancyService } from '../vacancies/vacancy.service.js';
import {
  PublicApplicationTokenParamsDto,
  SubmitPublicApplicationDto,
} from './dto/submit-public-application.dto.js';
import { VacancyCandidateService } from './vacancy-candidate.service.js';

// Unauthenticated: the unguessable per-vacancy token is the only credential.
@Controller('public/applications')
export class PublicApplicationController {
  constructor(
    private readonly vacancyCandidateService: VacancyCandidateService,
    private readonly vacancyService: VacancyService,
  ) {}

  @Get(':token')
  async findOne(
    @Param() params: PublicApplicationTokenParamsDto,
  ): Promise<IPublicApplicationResponse> {
    return this.vacancyService.findPublicApplication(params.token);
  }

  @Post(':token/submit')
  @HttpCode(202)
  async submit(
    @Param() params: PublicApplicationTokenParamsDto,
    @Body() dto: SubmitPublicApplicationDto,
  ): Promise<{ message: string }> {
    await this.vacancyCandidateService.submitPublicApplication(params.token, dto);
    return { message: 'Your CV has been submitted successfully.' };
  }
}
