"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateCvProcessingScheduler = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const cv_extraction_types_js_1 = require("../ai/cv-extraction.types.js");
const MAX_CONCURRENT_CV_PROCESSING = 3;
let CandidateCvProcessingScheduler = class CandidateCvProcessingScheduler {
    prisma;
    extractionService;
    logger;
    activeCount = 0;
    queuedCandidateIds = [];
    constructor(prisma, extractionService, logger) {
        this.prisma = prisma;
        this.extractionService = extractionService;
        this.logger = logger;
    }
    schedule(candidateId) {
        this.queuedCandidateIds.push(candidateId);
        this.startNext();
    }
    startNext() {
        while (this.activeCount < MAX_CONCURRENT_CV_PROCESSING && this.queuedCandidateIds.length > 0) {
            const candidateId = this.queuedCandidateIds.shift();
            if (candidateId === undefined)
                return;
            this.activeCount += 1;
            setImmediate(() => {
                void this.process(candidateId).finally(() => {
                    this.activeCount -= 1;
                    this.startNext();
                });
            });
        }
    }
    async process(candidateId) {
        const claim = await this.prisma.candidate.updateMany({
            where: {
                id: candidateId,
                processingStatus: {
                    in: [client_1.CandidateProcessingStatus.UPLOADED, client_1.CandidateProcessingStatus.FAILED],
                },
            },
            data: { cvProcessingError: null, processingStatus: client_1.CandidateProcessingStatus.AI_PROCESSING },
        });
        if (claim.count === 0)
            return;
        try {
            const candidate = await this.prisma.candidate.findUniqueOrThrow({
                where: { id: candidateId },
            });
            if (candidate.cvExtractedText === null)
                throw new Error('Missing CV text.');
            const extractedData = cv_extraction_types_js_1.extractedCvDataSchema.parse(await this.extractionService.extract(candidate.cvExtractedText));
            const extractedEmail = normalizeEmail(extractedData.candidate.email);
            if (extractedEmail !== null) {
                const association = await this.prisma.vacancyCandidate.findFirst({
                    where: { candidateId },
                    select: { vacancyId: true },
                });
                if (association === null)
                    throw new Error('Candidate vacancy association is missing.');
                const duplicate = await this.prisma.$transaction(async (transaction) => {
                    await transaction.$executeRaw `SELECT pg_advisory_xact_lock(hashtext(${`${association.vacancyId}:${extractedEmail}`}))`;
                    const existingAssociation = await transaction.vacancyCandidate.findFirst({
                        where: {
                            vacancyId: association.vacancyId,
                            candidate: { is: { email: extractedEmail, id: { not: candidateId } } },
                        },
                        select: { id: true },
                    });
                    if (existingAssociation !== null)
                        return true;
                    await transaction.candidate.update({
                        where: { id: candidateId },
                        data: {
                            ...(extractedData.candidate.fullName === null
                                ? {}
                                : { name: extractedData.candidate.fullName }),
                            email: extractedEmail,
                            ...(extractedData.candidate.phone === null
                                ? {}
                                : { phone: extractedData.candidate.phone }),
                            cvExtractedData: extractedData,
                            cvProcessingError: null,
                            processingStatus: client_1.CandidateProcessingStatus.READY,
                        },
                    });
                    return false;
                });
                if (duplicate)
                    throw new Error('A candidate with the extracted email already exists.');
            }
            else {
                await this.prisma.candidate.update({
                    where: { id: candidateId },
                    data: {
                        ...(extractedData.candidate.fullName === null
                            ? {}
                            : { name: extractedData.candidate.fullName }),
                        ...(extractedEmail === null ? {} : { email: extractedEmail }),
                        ...(extractedData.candidate.phone === null
                            ? {}
                            : { phone: extractedData.candidate.phone }),
                        cvExtractedData: extractedData,
                        cvProcessingError: null,
                        processingStatus: client_1.CandidateProcessingStatus.READY,
                    },
                });
            }
        }
        catch (error) {
            this.logger.error('Candidate CV processing failed', {
                event: 'candidate_cv.processing.failed',
                candidateId,
                error: (0, error_serializer_js_1.serializeError)(error),
            });
            await this.prisma.candidate.updateMany({
                where: { id: candidateId, processingStatus: client_1.CandidateProcessingStatus.AI_PROCESSING },
                data: {
                    cvProcessingError: error instanceof Error &&
                        error.message === 'A candidate with the extracted email already exists.'
                        ? error.message
                        : 'We could not extract candidate information from this CV.',
                    processingStatus: client_1.CandidateProcessingStatus.FAILED,
                },
            });
        }
    }
};
exports.CandidateCvProcessingScheduler = CandidateCvProcessingScheduler;
exports.CandidateCvProcessingScheduler = CandidateCvProcessingScheduler = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cv_extraction_types_js_1.CV_EXTRACTION_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService, Object, structured_logger_service_js_1.StructuredLogger])
], CandidateCvProcessingScheduler);
function normalizeEmail(email) {
    return email === null ? null : email.trim().toLowerCase();
}
//# sourceMappingURL=candidate-cv-processing-scheduler.service.js.map