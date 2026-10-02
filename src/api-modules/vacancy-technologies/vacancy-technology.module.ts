import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { TechnologyModule } from '../technologies/technology.module.js';
import { TechnologySegmentModule } from '../technology-segments/technology-segment.module.js';
import { VacancyModule } from '../vacancies/vacancy.module.js';
import { VacancyTechnologyController } from './vacancy-technology.controller.js';
import { VacancyTechnologyService } from './vacancy-technology.service.js';

@Module({
  imports: [AuthModule, TechnologyModule, TechnologySegmentModule, VacancyModule],
  controllers: [VacancyTechnologyController],
  providers: [VacancyTechnologyService],
  exports: [VacancyTechnologyService],
})
export class VacancyTechnologyModule {}
