import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InterviewEvaluationStatus, InterviewSessionStatus } from '@prisma/client';

import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { serializeError } from '../../infrastructure/logging/error-serializer.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { InterviewOverallEvaluationService } from './interview-overall-evaluation.service.js';

const EVALUATION_LEASE_MS = 10 * 60 * 1000;

@Injectable()
export class InterviewEvaluationScheduler implements OnApplicationBootstrap {
  constructor(
    private readonly processor: InterviewOverallEvaluationService,
    private readonly prisma: PrismaService,
    private readonly logger: StructuredLogger,
  ) {}

  // Startup recovery is best-effort: a database outage must not prevent the API from booting.
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.recoverPendingEvaluations();
    } catch (error: unknown) {
      this.logger.error('Skipped pending interview evaluation recovery', {
        event: 'interview.evaluation.recovery_failed',
        error: serializeError(error),
      });
    }
  }

  private async recoverPendingEvaluations(): Promise<void> {
    const staleBefore = new Date(Date.now() - EVALUATION_LEASE_MS);
    await this.prisma.interviewSession.updateMany({
      where: {
        status: InterviewSessionStatus.COMPLETED,
        evaluationStatus: InterviewEvaluationStatus.EVALUATING,
        evaluationStartedAt: { lt: staleBefore },
      },
      data: { evaluationStatus: InterviewEvaluationStatus.NOT_STARTED },
    });
    const sessions = await this.prisma.interviewSession.findMany({
      where: {
        status: InterviewSessionStatus.COMPLETED,
        evaluationStatus: {
          in: [InterviewEvaluationStatus.NOT_STARTED, InterviewEvaluationStatus.FAILED],
        },
      },
      select: { invitationId: true },
    });
    sessions.forEach((session) => this.schedule(session.invitationId));
  }

  schedule(interviewId: string): void {
    setImmediate(() => {
      void this.processor.evaluateForInterview(interviewId).catch((error: unknown) => {
        this.logger.error('Whole interview evaluation task failed', {
          event: 'interview.evaluation.task_failed',
          error: serializeError(error),
          interviewId,
        });
      });
    });
  }
}
