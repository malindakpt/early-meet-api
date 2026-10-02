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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewEvaluationScheduler = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const interview_overall_evaluation_service_js_1 = require("./interview-overall-evaluation.service.js");
const EVALUATION_LEASE_MS = 10 * 60 * 1000;
let InterviewEvaluationScheduler = class InterviewEvaluationScheduler {
    processor;
    prisma;
    logger;
    constructor(processor, prisma, logger) {
        this.processor = processor;
        this.prisma = prisma;
        this.logger = logger;
    }
    // Startup recovery is best-effort: a database outage must not prevent the API from booting.
    async onApplicationBootstrap() {
        try {
            await this.recoverPendingEvaluations();
        }
        catch (error) {
            this.logger.error('Skipped pending interview evaluation recovery', {
                event: 'interview.evaluation.recovery_failed',
                error: (0, error_serializer_js_1.serializeError)(error),
            });
        }
    }
    async recoverPendingEvaluations() {
        const staleBefore = new Date(Date.now() - EVALUATION_LEASE_MS);
        await this.prisma.interviewSession.updateMany({
            where: {
                status: client_1.InterviewSessionStatus.COMPLETED,
                evaluationStatus: client_1.InterviewEvaluationStatus.EVALUATING,
                evaluationStartedAt: { lt: staleBefore },
            },
            data: { evaluationStatus: client_1.InterviewEvaluationStatus.NOT_STARTED },
        });
        const sessions = await this.prisma.interviewSession.findMany({
            where: {
                status: client_1.InterviewSessionStatus.COMPLETED,
                evaluationStatus: {
                    in: [client_1.InterviewEvaluationStatus.NOT_STARTED, client_1.InterviewEvaluationStatus.FAILED],
                },
            },
            select: { invitationId: true },
        });
        sessions.forEach((session) => this.schedule(session.invitationId));
    }
    schedule(interviewId) {
        setImmediate(() => {
            void this.processor.evaluateForInterview(interviewId).catch((error) => {
                this.logger.error('Whole interview evaluation task failed', {
                    event: 'interview.evaluation.task_failed',
                    error: (0, error_serializer_js_1.serializeError)(error),
                    interviewId,
                });
            });
        });
    }
};
exports.InterviewEvaluationScheduler = InterviewEvaluationScheduler;
exports.InterviewEvaluationScheduler = InterviewEvaluationScheduler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [interview_overall_evaluation_service_js_1.InterviewOverallEvaluationService,
        prisma_service_js_1.PrismaService,
        structured_logger_service_js_1.StructuredLogger])
], InterviewEvaluationScheduler);
//# sourceMappingURL=interview-evaluation-scheduler.service.js.map