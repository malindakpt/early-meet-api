import { z } from 'zod';

export const assessmentAreaSchema = z.object({
  importance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  name: z.string().trim().min(1).max(120),
});

export const roleAnalysisSchema = z.object({
  experienceAreas: z.array(assessmentAreaSchema).min(1).max(20),
});

export type IAssessmentArea = z.infer<typeof assessmentAreaSchema>;
export type IRoleAnalysis = z.infer<typeof roleAnalysisSchema>;

export interface IAssessmentAreaSuggestionLlmService {
  analyzeRole(input: IRoleAnalysisInput): Promise<IRoleAnalysis>;
}

export interface IRoleAnalysisInput {
  jobDescription: string;
  seniority: string;
  vacancyTitle: string;
}

export const ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE = Symbol(
  'ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE',
);
