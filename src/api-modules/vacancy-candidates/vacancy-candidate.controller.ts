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
import { CreateVacancyCandidateDto } from './dto/create-vacancy-candidate.dto.js';
import { CandidateRankingQueryDto } from './dto/candidate-ranking-query.dto.js';
import { UploadCandidateCvsDto } from './dto/upload-candidate-cvs.dto.js';
import { UpdateVacancyCandidateDto } from './dto/update-vacancy-candidate.dto.js';
import { VacancyCandidateListQueryDto } from './dto/vacancy-candidate-list-query.dto.js';
import {
  type IVacancyCandidateListResponse,
  type IVacancyCandidateResponse,
  VacancyCandidateService,
} from './vacancy-candidate.service.js';
import {
  CandidateRankingService,
  type ICandidateRankingResponse,
} from './candidate-ranking.service.js';

@Controller('vacancies/:vacancyId/candidates')
@UseGuards(AuthenticationGuard)
export class VacancyCandidateController {
  constructor(
    private readonly candidateRankingService: CandidateRankingService,
    private readonly vacancyCandidateService: VacancyCandidateService,
  ) {}

  @Post('cv-upload')
  @HttpCode(202)
  async uploadCvs(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: UploadCandidateCvsDto,
  ): Promise<{
    items: Array<{
      candidateId?: string;
      fileName: string;
      message?: string;
      status: 'CREATED' | 'DUPLICATE';
    }>;
  }> {
    return this.vacancyCandidateService.uploadCvs(user, vacancyId, dto);
  }

  @Post(':id/retry-cv-processing')
  @HttpCode(202)
  async retryCvProcessing(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyCandidateId: string,
  ): Promise<IVacancyCandidateResponse> {
    return this.vacancyCandidateService.retryCvProcessing(user, vacancyId, vacancyCandidateId);
  }

  @Post()
  async create(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: CreateVacancyCandidateDto,
  ): Promise<IVacancyCandidateResponse> {
    return this.vacancyCandidateService.create(user, vacancyId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Query() query: VacancyCandidateListQueryDto,
  ): Promise<IVacancyCandidateListResponse> {
    return this.vacancyCandidateService.findAll(user, vacancyId, query);
  }

  @Get('ranking')
  async findRanking(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Query() query: CandidateRankingQueryDto,
  ): Promise<ICandidateRankingResponse> {
    return this.candidateRankingService.findAll(user, vacancyId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyCandidateId: string,
  ): Promise<IVacancyCandidateResponse> {
    return this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyCandidateId: string,
    @Body() dto: UpdateVacancyCandidateDto,
  ): Promise<IVacancyCandidateResponse> {
    return this.vacancyCandidateService.update(user, vacancyId, vacancyCandidateId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyCandidateId: string,
  ): Promise<void> {
    await this.vacancyCandidateService.remove(user, vacancyId, vacancyCandidateId);
  }
}
