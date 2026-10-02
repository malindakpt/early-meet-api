import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { TechnologySegment } from '@prisma/client';

import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard.js';
import { CreateTechnologySegmentDto } from './dto/create-technology-segment.dto.js';
import { UpdateTechnologySegmentDto } from './dto/update-technology-segment.dto.js';
import { TechnologySegmentService } from './technology-segment.service.js';

@Controller('technologies/:technologyId/segments')
@UseGuards(AuthenticationGuard)
export class TechnologySegmentController {
  constructor(private readonly technologySegmentService: TechnologySegmentService) {}

  @Post()
  @UseGuards(PlatformAdminGuard)
  async create(
    @Param('technologyId') technologyId: string,
    @Body() dto: CreateTechnologySegmentDto,
  ): Promise<TechnologySegment> {
    return this.technologySegmentService.create(technologyId, dto);
  }

  @Get()
  async findAll(@Param('technologyId') technologyId: string): Promise<TechnologySegment[]> {
    return this.technologySegmentService.findAll(technologyId);
  }

  @Get(':id')
  async findOne(
    @Param('technologyId') technologyId: string,
    @Param('id') segmentId: string,
  ): Promise<TechnologySegment> {
    return this.technologySegmentService.findOne(technologyId, segmentId);
  }

  @Patch(':id')
  @UseGuards(PlatformAdminGuard)
  async update(
    @Param('technologyId') technologyId: string,
    @Param('id') segmentId: string,
    @Body() dto: UpdateTechnologySegmentDto,
  ): Promise<TechnologySegment> {
    return this.technologySegmentService.update(technologyId, segmentId, dto);
  }
}
