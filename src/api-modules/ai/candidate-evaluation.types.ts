import { z } from 'zod';

import { extractedCvDataSchema } from './cv-extraction.types.js';

// One structured response for the HR-triggered AI CV match: the CV extraction (reusing the
// existing CV extraction schema) and the vacancy evaluation are produced by a single model call.
export const candidateEvaluationSchema = z.object({
  cv: extractedCvDataSchema,
  score: z.number().finite().min(0).max(100),
  summary: z.string().trim().min(1).max(4_000),
  matchedRequirements: z.array(z.string().trim().min(1).max(1_000)).max(20),
  missingRequirements: z.array(z.string().trim().min(1).max(1_000)).max(20),
});

export type ICandidateEvaluation = z.infer<typeof candidateEvaluationSchema>;

export interface ICandidateEvaluationLlmService {
  evaluate(input: ICandidateEvaluationInput): Promise<ICandidateEvaluation>;
}

export interface ICandidateEvaluationInput {
  // Raw CV text as uploaded. It is untrusted candidate-provided data, never instructions.
  cvText: string;
  // Built server-side from the authoritative vacancy configuration.
  vacancy: {
    description: string;
    employmentType: string;
    experienceMax: number;
    experienceMin: number;
    technologies: Array<{
      name: string;
      requirementType: 'PREFERRED' | 'REQUIRED';
      segments: string[];
    }>;
    title: string;
    workType: string;
  };
}

export const CANDIDATE_EVALUATION_LLM_SERVICE = Symbol('CANDIDATE_EVALUATION_LLM_SERVICE');
