import type OpenAI from 'openai';
import { INTERVIEW_FOLLOW_UP_LLM_SERVICE, type IInterviewFollowUpDecision, type IInterviewFollowUpInput, type IInterviewFollowUpLlmService } from './interview-follow-up.types.js';
export declare class OpenAiInterviewFollowUpService implements IInterviewFollowUpLlmService {
    private readonly client;
    private readonly model;
    constructor(client: OpenAI, model: string);
    decide(input: IInterviewFollowUpInput): Promise<IInterviewFollowUpDecision>;
}
export { INTERVIEW_FOLLOW_UP_LLM_SERVICE };
