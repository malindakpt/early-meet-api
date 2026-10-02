import type OpenAI from 'openai';
import { type IAssessmentAreaSuggestionLlmService, type IRoleAnalysis, type IRoleAnalysisInput } from './assessment-area-suggestion.types.js';
export declare class OpenAiAssessmentAreaSuggestionService implements IAssessmentAreaSuggestionLlmService {
    private readonly client;
    private readonly model;
    constructor(client: OpenAI, model: string);
    analyzeRole(input: IRoleAnalysisInput): Promise<IRoleAnalysis>;
}
