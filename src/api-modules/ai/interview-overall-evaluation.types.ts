import { z } from 'zod';

export const interviewAssessmentLevelSchema = z.enum([
  'STRONG',
  'GOOD',
  'MODERATE',
  'WEAK',
  'NO_EVIDENCE',
]);

export const interviewOverallEvaluationSchema = z.object({
  areasToProbe: z
    .array(
      z.object({
        questionIds: z.array(z.string().uuid()).min(1).max(5),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .max(5),
  competencies: z.object({
    communication: interviewAssessmentLevelSchema,
    problemSolving: interviewAssessmentLevelSchema,
    technicalDepth: interviewAssessmentLevelSchema,
  }),
  skills: z
    .array(
      z.object({
        evidence: z.string().trim().min(1).max(500),
        level: interviewAssessmentLevelSchema,
        vacancyTechnologyId: z.string().uuid(),
      }),
    )
    .max(100),
  strengths: z
    .array(
      z.object({
        questionIds: z.array(z.string().uuid()).min(1).max(5),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .max(5),
  summary: z.string().trim().min(1).max(1_000),
});

export type IInterviewOverallEvaluation = z.infer<typeof interviewOverallEvaluationSchema>;

export interface IInterviewOverallEvaluationInput {
  coreAnswers: Array<{
    answerText: string;
    questionId: string;
    question: {
      difficulty: string;
      evaluationCriteria: unknown;
      questionText: string;
      questionType: string;
      technology: string | null;
      technologySegment: string | null;
    };
    sequence: number;
  }>;
  followUpAnswers: Array<{
    answerText: string;
    parentCoreQuestionId: string;
    questionId: string;
    questionText: string;
  }>;
  vacancy: {
    description: string;
    difficulty: string;
    interviewType: string;
    skills: Array<{
      name: string;
      requirementType: 'PREFERRED' | 'REQUIRED';
      segmentName: string | null;
      vacancyTechnologyId: string;
    }>;
    title: string;
  };
}

export interface IInterviewOverallEvaluationLlmService {
  evaluate(input: IInterviewOverallEvaluationInput): Promise<IInterviewOverallEvaluation>;
}

export const INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE = Symbol(
  'INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE',
);
