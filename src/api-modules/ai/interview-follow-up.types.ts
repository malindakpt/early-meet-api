import { z } from 'zod';

export const interviewFollowUpOutputSchema = z.object({
  shouldFollowUp: z.boolean(),
  reason: z.string().trim().min(1).max(2_000),
  followUpQuestion: z.string().trim().min(1).max(2_000).nullable(),
});

export const interviewFollowUpSchema = z.discriminatedUnion('shouldFollowUp', [
  z.object({
    shouldFollowUp: z.literal(false),
    reason: z.string().trim().min(1).max(2_000),
    followUpQuestion: z.null(),
  }),
  z.object({
    shouldFollowUp: z.literal(true),
    reason: z.string().trim().min(1).max(2_000),
    followUpQuestion: z.string().trim().min(1).max(2_000),
  }),
]);

export type IInterviewFollowUpDecision = z.infer<typeof interviewFollowUpSchema>;

export interface IInterviewFollowUpInput {
  answer: {
    evaluation: { explanation: string; score: number };
    text: string;
  };
  question: {
    evaluationCriteria: unknown;
    questionText: string;
  };
}

export interface IInterviewFollowUpLlmService {
  decide(input: IInterviewFollowUpInput): Promise<IInterviewFollowUpDecision>;
}

export const INTERVIEW_FOLLOW_UP_LLM_SERVICE = Symbol('INTERVIEW_FOLLOW_UP_LLM_SERVICE');
