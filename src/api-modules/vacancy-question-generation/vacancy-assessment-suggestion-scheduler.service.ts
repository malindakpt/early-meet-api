import { Injectable } from '@nestjs/common';

import { configurationValues } from '../../infrastructure/config/configuration-values.js';
import { VacancyAssessmentSuggestionService } from './vacancy-assessment-suggestion.service.js';

@Injectable()
export class VacancyAssessmentSuggestionScheduler {
  private activeCount = 0;
  private readonly queuedGenerationIds: string[] = [];

  constructor(private readonly suggestionService: VacancyAssessmentSuggestionService) {}

  schedule(generationId: string): void {
    if (this.queuedGenerationIds.includes(generationId)) return;
    this.queuedGenerationIds.push(generationId);
    this.startNext();
  }

  private startNext(): void {
    while (
      this.activeCount < configurationValues.assessmentAreaGeneration.maxConcurrentGenerations &&
      this.queuedGenerationIds.length > 0
    ) {
      const generationId = this.queuedGenerationIds.shift();
      if (generationId === undefined) return;
      this.activeCount += 1;
      setImmediate(() => {
        void this.suggestionService.process(generationId).finally(() => {
          this.activeCount -= 1;
          this.startNext();
        });
      });
    }
  }
}
