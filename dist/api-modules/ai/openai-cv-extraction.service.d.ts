import type OpenAI from 'openai';
import { CV_EXTRACTION_SERVICE, type ICvExtractionService, type IExtractedCvData } from './cv-extraction.types.js';
export declare const OPENAI_CLIENT: unique symbol;
export declare const OPENAI_CV_MODEL: unique symbol;
export declare class OpenAiCvExtractionService implements ICvExtractionService {
    private readonly client;
    private readonly model;
    constructor(client: OpenAI, model: string);
    extract(extractedText: string): Promise<IExtractedCvData>;
}
export { CV_EXTRACTION_SERVICE };
