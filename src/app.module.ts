import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AuthModule } from './api-modules/auth/auth.module.js';
import { CandidateModule } from './api-modules/candidates/candidate.module.js';
import { CandidateVacancyMatchingModule } from './api-modules/candidate-matching/candidate-vacancy-matching.module.js';
import { HealthModule } from './api-modules/health/health.module.js';
import { InterviewModule } from './api-modules/interviews/interview.module.js';
import { QuestionModule } from './api-modules/questions/question.module.js';
import { VacancyQuestionGenerationModule } from './api-modules/vacancy-question-generation/vacancy-question-generation.module.js';
import { TechnologyModule } from './api-modules/technologies/technology.module.js';
import { TechnologySegmentModule } from './api-modules/technology-segments/technology-segment.module.js';
import { VacancyModule } from './api-modules/vacancies/vacancy.module.js';
import { VacancyCandidateModule } from './api-modules/vacancy-candidates/vacancy-candidate.module.js';
import { VacancyTechnologyModule } from './api-modules/vacancy-technologies/vacancy-technology.module.js';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor.js';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor.js';
import { validateEnvironment } from './infrastructure/config/environment.validation.js';
import { StructuredLogger } from './infrastructure/logging/structured-logger.service.js';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    CandidateModule,
    CandidateVacancyMatchingModule,
    HealthModule,
    InterviewModule,
    QuestionModule,
    VacancyQuestionGenerationModule,
    TechnologyModule,
    TechnologySegmentModule,
    VacancyModule,
    VacancyCandidateModule,
    VacancyTechnologyModule,
  ],
  providers: [
    StructuredLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
