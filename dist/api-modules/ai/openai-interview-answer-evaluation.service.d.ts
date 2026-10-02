import type OpenAI from 'openai';
import { INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE, type IInterviewAnswerEvaluation, type IInterviewAnswerEvaluationInput, type IInterviewAnswerEvaluationLlmService } from './interview-answer-evaluation.types.js';
export declare class OpenAiInterviewAnswerEvaluationService implements IInterviewAnswerEvaluationLlmService {
    private readonly client;
    private readonly model;
    constructor(client: OpenAI, model: string);
    evaluate(input: IInterviewAnswerEvaluationInput): Promise<IInterviewAnswerEvaluation>;
}
export { INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE };
