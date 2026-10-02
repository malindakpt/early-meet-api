import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { TechnologySegmentModule } from '../technology-segments/technology-segment.module.js';
import { TechnologyModule } from '../technologies/technology.module.js';
import { QuestionController } from './question.controller.js';
import { QuestionService } from './question.service.js';

@Module({
  imports: [AuthModule, TechnologyModule, TechnologySegmentModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
