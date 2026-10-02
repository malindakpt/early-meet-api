import { z } from 'zod';
export declare const interviewFollowUpOutputSchema: z.ZodObject<{
    shouldFollowUp: z.ZodBoolean;
    reason: z.ZodString;
    followUpQuestion: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const interviewFollowUpSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    shouldFollowUp: z.ZodLiteral<false>;
    reason: z.ZodString;
    followUpQuestion: z.ZodNull;
}, z.core.$strip>, z.ZodObject<{
    shouldFollowUp: z.ZodLiteral<true>;
    reason: z.ZodString;
    followUpQuestion: z.ZodString;
}, z.core.$strip>], "shouldFollowUp">;
export type IInterviewFollowUpDecision = z.infer<typeof interviewFollowUpSchema>;
export interface IInterviewFollowUpInput {
    answer: {
        evaluation: {
            explanation: string;
            score: number;
        };
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
export declare const INTERVIEW_FOLLOW_UP_LLM_SERVICE: unique symbol;
