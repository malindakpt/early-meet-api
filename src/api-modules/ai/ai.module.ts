import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { CANDIDATE_EVALUATION_LLM_SERVICE } from './candidate-evaluation.types.js';
import { ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE } from './assessment-area-suggestion.types.js';
import { CV_EXTRACTION_SERVICE } from './cv-extraction.types.js';
import { INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE } from './interview-answer-evaluation.types.js';
import { INTERVIEW_FOLLOW_UP_LLM_SERVICE } from './interview-follow-up.types.js';
import { INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE } from './interview-overall-evaluation.types.js';
import {
  OpenAiCandidateEvaluationService,
  OPENAI_CANDIDATE_EVALUATION_MODEL,
} from './openai-candidate-evaluation.service.js';
import {
  OpenAiCvExtractionService,
  OPENAI_CLIENT,
  OPENAI_CV_MODEL,
} from './openai-cv-extraction.service.js';
import { OpenAiInterviewAnswerEvaluationService } from './openai-interview-answer-evaluation.service.js';
import { OpenAiInterviewFollowUpService } from './openai-interview-follow-up.service.js';
import { OpenAiInterviewOverallEvaluationService } from './openai-interview-overall-evaluation.service.js';
import { OpenAiAssessmentAreaSuggestionService } from './openai-assessment-area-suggestion.service.js';
import type { IEnvironmentVariables } from '../../infrastructure/config/environment.validation.js';
import { configurationValues } from '../../infrastructure/config/configuration-values.js';

@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<IEnvironmentVariables, true>) =>
        new OpenAI({
          apiKey: config.getOrThrow('OPENAI_API_KEY'),
          maxRetries: configurationValues.openAi.maxRetries,
          timeout: config.getOrThrow('OPENAI_TIMEOUT_MS'),
        }),
    },
    {
      provide: OPENAI_CV_MODEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<IEnvironmentVariables, true>) =>
        config.getOrThrow('OPENAI_CV_EXTRACTION_MODEL'),
    },
    {
      provide: OPENAI_CANDIDATE_EVALUATION_MODEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<IEnvironmentVariables, true>) =>
        config.getOrThrow('OPENAI_CANDIDATE_EVALUATION_MODEL'),
    },
    OpenAiCvExtractionService,
    OpenAiCandidateEvaluationService,
    OpenAiInterviewAnswerEvaluationService,
    OpenAiInterviewFollowUpService,
    OpenAiInterviewOverallEvaluationService,
    OpenAiAssessmentAreaSuggestionService,
    {
      provide: ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE,
      useExisting: OpenAiAssessmentAreaSuggestionService,
    },
    {
      provide: CV_EXTRACTION_SERVICE,
      useExisting: OpenAiCvExtractionService,
    },
    {
      provide: CANDIDATE_EVALUATION_LLM_SERVICE,
      useExisting: OpenAiCandidateEvaluationService,
    },
    {
      provide: INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE,
      useExisting: OpenAiInterviewAnswerEvaluationService,
    },
    {
      provide: INTERVIEW_FOLLOW_UP_LLM_SERVICE,
      useExisting: OpenAiInterviewFollowUpService,
    },
    {
      provide: INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE,
      useExisting: OpenAiInterviewOverallEvaluationService,
    },
  ],
  exports: [
    ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE,
    CANDIDATE_EVALUATION_LLM_SERVICE,
    CV_EXTRACTION_SERVICE,
    INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE,
    INTERVIEW_FOLLOW_UP_LLM_SERVICE,
    INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE,
  ],
})
export class AiModule {}
