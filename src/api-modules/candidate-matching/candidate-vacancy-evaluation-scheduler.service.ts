import { Injectable } from '@nestjs/common';

import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { serializeError } from '../../infrastructure/logging/error-serializer.js';
import { CandidateVacancyEvaluationService } from './candidate-vacancy-evaluation.service.js';

@Injectable()
export class CandidateVacancyEvaluationScheduler {
  private readonly scheduledCandidateIds = new Set<string>();

  constructor(
    private readonly evaluationService: CandidateVacancyEvaluationService,
    private readonly logger: StructuredLogger,
  ) {}

  schedule(user: IAuthenticatedUser, vacancyId: string, vacancyCandidateId: string): void {
    if (this.scheduledCandidateIds.has(vacancyCandidateId)) {
      return;
    }
    this.scheduledCandidateIds.add(vacancyCandidateId);
    setImmediate(() => {
      void this.process(user, vacancyId, vacancyCandidateId);
    });
  }

  private async process(
    user: IAuthenticatedUser,
    vacancyId: string,
    vacancyCandidateId: string,
  ): Promise<void> {
    try {
      if (!(await this.evaluationService.claim(vacancyCandidateId))) return;
      await this.evaluationService.process(user, vacancyId, vacancyCandidateId);
    } catch (error: unknown) {
      await this.evaluationService.fail(vacancyCandidateId);
      this.logger.error('Candidate vacancy evaluation failed', {
        event: 'candidate_vacancy.evaluation.failed',
        vacancyId,
        vacancyCandidateId,
        error: serializeError(error),
      });
    } finally {
      this.scheduledCandidateIds.delete(vacancyCandidateId);
    }
  }
}
