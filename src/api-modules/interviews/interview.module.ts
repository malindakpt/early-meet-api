import { Module } from '@nestjs/common';

import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';
import { EmailModule } from '../email/email.module.js';
import { VacancyCandidateModule } from '../vacancy-candidates/vacancy-candidate.module.js';
import { VacancyQuestionGenerationModule } from '../vacancy-question-generation/vacancy-question-generation.module.js';
import { VacancyModule } from '../vacancies/vacancy.module.js';
import { CandidateInterviewController } from './candidate-interview.controller.js';
import { InterviewController } from './interview.controller.js';
import { InterviewReviewController } from './interview-review.controller.js';
import { InterviewAnswerEvaluationService } from './interview-answer-evaluation.service.js';
import { InterviewEvaluationScheduler } from './interview-evaluation-scheduler.service.js';
import { InterviewFollowUpService } from './interview-follow-up.service.js';
import { InterviewOverallEvaluationService } from './interview-overall-evaluation.service.js';
import { InterviewService } from './interview.service.js';

@Module({
  imports: [
    AiModule,
    AuthModule,
    EmailModule,
    VacancyCandidateModule,
    VacancyModule,
    VacancyQuestionGenerationModule,
  ],
  controllers: [InterviewController, CandidateInterviewController, InterviewReviewController],
  providers: [
    InterviewAnswerEvaluationService,
    InterviewEvaluationScheduler,
    InterviewFollowUpService,
    InterviewOverallEvaluationService,
    InterviewService,
    StructuredLogger,
  ],
})
export class InterviewModule {}
