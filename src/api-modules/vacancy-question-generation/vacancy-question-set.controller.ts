import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { AddVacancyQuestionDto } from './dto/add-vacancy-question.dto.js';
import { CreateVacancyCustomQuestionDto } from './dto/create-vacancy-custom-question.dto.js';
import { UpdateVacancyQuestionDto } from './dto/update-vacancy-question.dto.js';
import { UpdateVacancyCustomQuestionDto } from './dto/update-vacancy-custom-question.dto.js';
import { QueryQuestionsDto } from '../questions/dto/query-questions.dto.js';
import {
  VacancyQuestionSetService,
  type IVacancyCustomQuestionResponse,
  type IVacancyQuestionResponse,
} from './vacancy-question-set.service.js';

@Controller('vacancies/:vacancyId/questions')
@UseGuards(AuthenticationGuard)
export class VacancyQuestionSetController {
  constructor(private readonly vacancyQuestionSetService: VacancyQuestionSetService) {}

  @Get()
  async findAll(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IVacancyQuestionResponse[]> {
    return this.vacancyQuestionSetService.findAll(user, vacancyId);
  }

  @Get('available')
  async findAvailable(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Query() query: QueryQuestionsDto,
  ) {
    return this.vacancyQuestionSetService.findAvailable(user, vacancyId, query);
  }

  @Post()
  async add(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: AddVacancyQuestionDto,
  ): Promise<IVacancyQuestionResponse> {
    return this.vacancyQuestionSetService.add(user, vacancyId, dto);
  }

  @Get('custom')
  async findAllCustom(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IVacancyCustomQuestionResponse[]> {
    return this.vacancyQuestionSetService.findAllCustom(user, vacancyId);
  }

  @Post('custom')
  async createCustom(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: CreateVacancyCustomQuestionDto,
  ): Promise<IVacancyCustomQuestionResponse> {
    return this.vacancyQuestionSetService.createCustom(user, vacancyId, dto);
  }

  @Patch('custom/:id')
  async updateCustom(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') customQuestionId: string,
    @Body() dto: UpdateVacancyCustomQuestionDto,
  ): Promise<IVacancyCustomQuestionResponse> {
    return this.vacancyQuestionSetService.updateCustom(user, vacancyId, customQuestionId, dto);
  }

  @Delete('custom/:id')
  @HttpCode(204)
  async removeCustom(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') customQuestionId: string,
  ): Promise<void> {
    await this.vacancyQuestionSetService.removeCustom(user, vacancyId, customQuestionId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyQuestionId: string,
    @Body() dto: UpdateVacancyQuestionDto,
  ): Promise<IVacancyQuestionResponse> {
    return this.vacancyQuestionSetService.update(user, vacancyId, vacancyQuestionId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyQuestionId: string,
  ): Promise<void> {
    await this.vacancyQuestionSetService.remove(user, vacancyId, vacancyQuestionId);
  }
}
