import { OnApplicationBootstrap } from '@nestjs/common';
import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { InterviewOverallEvaluationService } from './interview-overall-evaluation.service.js';
export declare class InterviewEvaluationScheduler implements OnApplicationBootstrap {
    private readonly processor;
    private readonly prisma;
    private readonly logger;
    constructor(processor: InterviewOverallEvaluationService, prisma: PrismaService, logger: StructuredLogger);
    onApplicationBootstrap(): Promise<void>;
    private recoverPendingEvaluations;
    schedule(interviewId: string): void;
}
