import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { TechnologyModule } from '../technologies/technology.module.js';
import { TechnologySegmentCollectionController } from './technology-segment-collection.controller.js';
import { TechnologySegmentController } from './technology-segment.controller.js';
import { TechnologySegmentService } from './technology-segment.service.js';

@Module({
  imports: [AuthModule, TechnologyModule],
  controllers: [TechnologySegmentCollectionController, TechnologySegmentController],
  providers: [TechnologySegmentService],
  exports: [TechnologySegmentService],
})
export class TechnologySegmentModule {}
