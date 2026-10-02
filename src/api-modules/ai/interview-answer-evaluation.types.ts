import { z } from 'zod';

export const interviewAnswerEvaluationSchema = z.object({
  explanation: z.string().trim().min(1).max(4_000),
  score: z.number().finite().min(0).max(100),
});

export type IInterviewAnswerEvaluation = z.infer<typeof interviewAnswerEvaluationSchema>;

export interface IInterviewAnswerEvaluationInput {
  answerText: string;
  question: {
    difficulty: string;
    evaluationCriteria: unknown;
    questionText: string;
    questionType: string;
  };
}

export interface IInterviewAnswerEvaluationLlmService {
  evaluate(input: IInterviewAnswerEvaluationInput): Promise<IInterviewAnswerEvaluation>;
}

export const INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE = Symbol(
  'INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE',
);
