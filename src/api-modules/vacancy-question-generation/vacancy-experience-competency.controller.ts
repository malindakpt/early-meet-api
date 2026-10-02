import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { CreateExperienceCompetencyPlanDto } from './dto/create-experience-competency-plan.dto.js';
import { SaveExperienceCompetencyConfigurationDto } from './dto/save-experience-competency-configuration.dto.js';
import { UpdateExperienceCompetencyAreaDto } from './dto/update-experience-competency-area.dto.js';
import { UpdateExperienceCompetencyQuestionDto } from './dto/update-experience-competency-question.dto.js';
import {
  VacancyExperienceCompetencyService,
  type IExperienceCompetencyAreaResponse,
} from './vacancy-experience-competency.service.js';

@Controller('vacancies/:vacancyId/experience-competency')
@UseGuards(AuthenticationGuard)
export class VacancyExperienceCompetencyController {
  constructor(
    private readonly vacancyExperienceCompetencyService: VacancyExperienceCompetencyService,
  ) {}

  @Get('areas')
  async findAll(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IExperienceCompetencyAreaResponse[]> {
    return this.vacancyExperienceCompetencyService.findAll(user, vacancyId);
  }

  @Post('plan')
  async createPlan(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: CreateExperienceCompetencyPlanDto,
  ): Promise<IExperienceCompetencyAreaResponse[]> {
    return this.vacancyExperienceCompetencyService.createPlan(user, vacancyId, dto);
  }

  @Put('configuration')
  async saveConfiguration(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: SaveExperienceCompetencyConfigurationDto,
  ): Promise<IExperienceCompetencyAreaResponse[]> {
    return this.vacancyExperienceCompetencyService.saveConfiguration(user, vacancyId, dto);
  }

  @Patch('areas/:areaId')
  async updateArea(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('areaId') areaId: string,
    @Body() dto: UpdateExperienceCompetencyAreaDto,
  ): Promise<IExperienceCompetencyAreaResponse> {
    return this.vacancyExperienceCompetencyService.updateArea(user, vacancyId, areaId, dto);
  }

  @Delete('areas/:areaId')
  @HttpCode(204)
  async removeArea(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('areaId') areaId: string,
  ): Promise<void> {
    await this.vacancyExperienceCompetencyService.removeArea(user, vacancyId, areaId);
  }

  @Patch('questions/:questionId')
  async updateQuestion(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateExperienceCompetencyQuestionDto,
  ) {
    return this.vacancyExperienceCompetencyService.updateQuestion(user, vacancyId, questionId, dto);
  }

  @Delete('questions/:questionId')
  @HttpCode(204)
  async removeQuestion(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    await this.vacancyExperienceCompetencyService.removeQuestion(user, vacancyId, questionId);
  }
}
