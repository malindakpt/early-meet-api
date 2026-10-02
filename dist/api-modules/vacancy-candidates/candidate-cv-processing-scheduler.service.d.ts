import { StructuredLogger } from '../../infrastructure/logging/structured-logger.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type ICvExtractionService } from '../ai/cv-extraction.types.js';
export declare class CandidateCvProcessingScheduler {
    private readonly prisma;
    private readonly extractionService;
    private readonly logger;
    private activeCount;
    private readonly queuedCandidateIds;
    constructor(prisma: PrismaService, extractionService: ICvExtractionService, logger: StructuredLogger);
    schedule(candidateId: string): void;
    private startNext;
    private process;
}
