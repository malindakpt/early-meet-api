import { Controller, Get, UseGuards } from '@nestjs/common';
import type { TechnologySegment } from '@prisma/client';

import { AuthenticationGuard } from '../auth/guards/authentication.guard.js';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard.js';
import { TechnologySegmentService } from './technology-segment.service.js';

@Controller('technology-segments')
@UseGuards(AuthenticationGuard, PlatformAdminGuard)
export class TechnologySegmentCollectionController {
  constructor(private readonly technologySegmentService: TechnologySegmentService) {}

  @Get()
  async findAll(): Promise<TechnologySegment[]> {
    return this.technologySegmentService.findAllAcrossTechnologies();
  }
}
