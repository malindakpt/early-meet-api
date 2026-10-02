import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { Technology } from '@prisma/client';

import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard.js';
import { CreateTechnologyDto } from './dto/create-technology.dto.js';
import { UpdateTechnologyDto } from './dto/update-technology.dto.js';
import { TechnologyService } from './technology.service.js';

@Controller('technologies')
@UseGuards(AuthenticationGuard)
export class TechnologyController {
  constructor(private readonly technologyService: TechnologyService) {}

  @Post()
  @UseGuards(PlatformAdminGuard)
  async create(@Body() dto: CreateTechnologyDto): Promise<Technology> {
    return this.technologyService.create(dto);
  }

  @Get()
  async findAll(): Promise<Technology[]> {
    return this.technologyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') technologyId: string): Promise<Technology> {
    return this.technologyService.findOne(technologyId);
  }

  @Patch(':id')
  @UseGuards(PlatformAdminGuard)
  async update(
    @Param('id') technologyId: string,
    @Body() dto: UpdateTechnologyDto,
  ): Promise<Technology> {
    return this.technologyService.update(technologyId, dto);
  }
}
