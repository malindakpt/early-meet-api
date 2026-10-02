import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { CreateVacancyDto } from './dto/create-vacancy.dto.js';
import { UpdateVacancyDto } from './dto/update-vacancy.dto.js';
import { type IVacancyResponse, VacancyService } from './vacancy.service.js';

@Controller('vacancies')
@UseGuards(AuthenticationGuard)
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @Post()
  async create(
    @CurrentUser() user: IAuthenticatedUser,
    @Body() dto: CreateVacancyDto,
  ): Promise<IVacancyResponse> {
    return this.vacancyService.create(user, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: IAuthenticatedUser): Promise<IVacancyResponse[]> {
    return this.vacancyService.findAll(user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('id') vacancyId: string,
  ): Promise<IVacancyResponse> {
    return this.vacancyService.findOne(user, vacancyId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('id') vacancyId: string,
    @Body() dto: UpdateVacancyDto,
  ): Promise<IVacancyResponse> {
    return this.vacancyService.update(user, vacancyId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('id') vacancyId: string,
  ): Promise<void> {
    await this.vacancyService.remove(user, vacancyId);
  }
}
