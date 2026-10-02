import type OpenAI from 'openai';
import { INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE, type IInterviewOverallEvaluation, type IInterviewOverallEvaluationInput, type IInterviewOverallEvaluationLlmService } from './interview-overall-evaluation.types.js';
export declare class OpenAiInterviewOverallEvaluationService implements IInterviewOverallEvaluationLlmService {
    private readonly client;
    private readonly model;
    constructor(client: OpenAI, model: string);
    evaluate(input: IInterviewOverallEvaluationInput): Promise<IInterviewOverallEvaluation>;
}
export { INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE };
