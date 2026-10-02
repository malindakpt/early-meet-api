import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { VacancyController } from './vacancy.controller.js';
import { VacancyService } from './vacancy.service.js';

@Module({
  imports: [AuthModule],
  controllers: [VacancyController],
  providers: [VacancyService],
  exports: [VacancyService],
})
export class VacancyModule {}
