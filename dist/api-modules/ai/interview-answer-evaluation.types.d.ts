import { z } from 'zod';
export declare const interviewAnswerEvaluationSchema: z.ZodObject<{
    explanation: z.ZodString;
    score: z.ZodNumber;
}, z.core.$strip>;
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
export declare const INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE: unique symbol;
