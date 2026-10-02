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
import { CreateVacancyTechnologyDto } from './dto/create-vacancy-technology.dto.js';
import { UpdateVacancyTechnologyDto } from './dto/update-vacancy-technology.dto.js';
import {
  VacancyTechnologyService,
  type IVacancyTechnologyResponse,
} from './vacancy-technology.service.js';

@Controller('vacancies/:vacancyId/technologies')
@UseGuards(AuthenticationGuard)
export class VacancyTechnologyController {
  constructor(private readonly vacancyTechnologyService: VacancyTechnologyService) {}

  @Post()
  async create(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Body() dto: CreateVacancyTechnologyDto,
  ): Promise<IVacancyTechnologyResponse> {
    return this.vacancyTechnologyService.create(user, vacancyId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
  ): Promise<IVacancyTechnologyResponse[]> {
    return this.vacancyTechnologyService.findAll(user, vacancyId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyTechnologyId: string,
    @Body() dto: UpdateVacancyTechnologyDto,
  ): Promise<IVacancyTechnologyResponse> {
    return this.vacancyTechnologyService.update(user, vacancyId, vacancyTechnologyId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('vacancyId') vacancyId: string,
    @Param('id') vacancyTechnologyId: string,
  ): Promise<void> {
    await this.vacancyTechnologyService.remove(user, vacancyId, vacancyTechnologyId);
  }
}
