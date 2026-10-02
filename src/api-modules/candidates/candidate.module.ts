import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CandidateService } from './candidate.service.js';

@Module({
  imports: [AuthModule],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
