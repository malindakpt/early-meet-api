import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { zodTextFormat } from 'openai/helpers/zod';
import type OpenAI from 'openai';

import {
  CV_EXTRACTION_SERVICE,
  extractedCvDataSchema,
  type ICvExtractionService,
  type IExtractedCvData,
} from './cv-extraction.types.js';

export const OPENAI_CLIENT = Symbol('OPENAI_CLIENT');
export const OPENAI_CV_MODEL = Symbol('OPENAI_CV_MODEL');

const CV_EXTRACTION_INSTRUCTIONS = `Extract structured candidate CV information from the supplied CV text only.

Never invent, infer, or guess facts. Use null when a scalar value is unavailable and [] when a list has no supported entries. Do not use placeholders such as "Unknown", "N/A", or "Not provided" unless they are factual and meaningful CV content. Preserve dates exactly as stated. Do not evaluate, rank, score, or match the candidate to a vacancy. Do not infer skills, employment, education, certifications, or contact details that are absent from the CV.`;

@Injectable()
export class OpenAiCvExtractionService implements ICvExtractionService {
  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    @Inject(OPENAI_CV_MODEL) private readonly model: string,
  ) {}

  async extract(extractedText: string): Promise<IExtractedCvData> {
    try {
      const response = await this.client.responses.parse({
        model: this.model,
        instructions: CV_EXTRACTION_INSTRUCTIONS,
        input: extractedText,
        text: {
          format: zodTextFormat(extractedCvDataSchema, 'extracted_cv_data'),
        },
      });
      return extractedCvDataSchema.parse(response.output_parsed);
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Unable to extract structured candidate CV data.: ${String(error)}`,
        { cause: error },
      );
    }
  }
}

export { CV_EXTRACTION_SERVICE };
