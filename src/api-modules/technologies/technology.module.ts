import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { TechnologyController } from './technology.controller.js';
import { TechnologyService } from './technology.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TechnologyController],
  providers: [TechnologyService],
  exports: [TechnologyService],
})
export class TechnologyModule {}
