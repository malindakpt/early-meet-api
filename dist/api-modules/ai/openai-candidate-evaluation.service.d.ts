import type OpenAI from 'openai';
import { CANDIDATE_EVALUATION_LLM_SERVICE, type ICandidateEvaluation, type ICandidateEvaluationInput, type ICandidateEvaluationLlmService } from './candidate-evaluation.types.js';
export declare const OPENAI_CANDIDATE_EVALUATION_MODEL: unique symbol;
export declare class OpenAiCandidateEvaluationService implements ICandidateEvaluationLlmService {
    private readonly client;
    private readonly model;
    constructor(client: OpenAI, model: string);
    evaluate(input: ICandidateEvaluationInput): Promise<ICandidateEvaluation>;
}
export { CANDIDATE_EVALUATION_LLM_SERVICE };
