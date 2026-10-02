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
exports.InterviewFollowUpService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const interview_follow_up_types_js_1 = require("../ai/interview-follow-up.types.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const vacancy_candidate_service_js_1 = require("../vacancy-candidates/vacancy-candidate.service.js");
const coreAnswerInclude = {
    interviewSession: { select: { status: true } },
    vacancyQuestion: { select: { evaluationCriteria: true, followUpAllowed: true } },
    vacancyCustomQuestion: { select: { id: true } },
    followUps: { select: { id: true } },
};
let InterviewFollowUpService = class InterviewFollowUpService {
    followUpLlmService;
    prisma;
    vacancyCandidateService;
    logger;
    constructor(followUpLlmService, prisma, vacancyCandidateService, logger) {
        this.followUpLlmService = followUpLlmService;
        this.prisma = prisma;
        this.vacancyCandidateService = vacancyCandidateService;
        this.logger = logger;
    }
    async decide(user, vacancyId, vacancyCandidateId, interviewId, answerId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const coreAnswer = await this.findCoreAnswer(vacancyId, vacancyCandidate.candidateId, interviewId, answerId);
        if (coreAnswer.score === null || coreAnswer.explanation === null) {
            throw new common_1.ConflictException('Evaluate the core answer before requesting a follow-up decision.');
        }
        if ((coreAnswer.vacancyQuestion === null && coreAnswer.vacancyCustomQuestion === null) ||
            coreAnswer.answerText === null) {
            throw new common_1.ConflictException('Only answered core questions can receive a follow-up.');
        }
        if (coreAnswer.followUps.length > 0) {
            throw new common_1.ConflictException('A follow-up has already been generated for this core question.');
        }
        if (coreAnswer.interviewSession.status !== client_1.InterviewSessionStatus.IN_PROGRESS) {
            throw new common_1.ConflictException('The interview is not available for a follow-up.');
        }
        const currentQuestion = await this.prisma.interviewQuestionAnswer.findFirst({
            where: {
                interviewSessionId: coreAnswer.interviewSessionId,
                status: client_1.InterviewQuestionStatus.ASKED,
            },
            select: { id: true },
        });
        if (currentQuestion !== null) {
            throw new common_1.ConflictException('The interview has already progressed beyond this core question.');
        }
        if (coreAnswer.vacancyQuestion === null || !coreAnswer.vacancyQuestion.followUpAllowed) {
            await this.continueToNextCoreQuestion(interviewId, answerId);
            return {
                shouldFollowUp: false,
                reason: 'Follow-ups are disabled for this core question.',
                followUpQuestion: null,
            };
        }
        let decision;
        try {
            decision = await this.followUpLlmService.decide(this.toFollowUpInput(coreAnswer));
        }
        catch (error) {
            await this.continueToNextCoreQuestion(interviewId, answerId);
            this.logger.error('Interview follow-up decision failed', {
                event: 'interview_follow_up.decision.failed',
                vacancyId,
                vacancyCandidateId,
                interviewId,
                answerId,
                error: (0, error_serializer_js_1.serializeError)(error),
            });
            return {
                shouldFollowUp: false,
                reason: 'A follow-up could not be generated.',
                followUpQuestion: null,
            };
        }
        if (!decision.shouldFollowUp) {
            await this.continueToNextCoreQuestion(interviewId, answerId);
            return { ...decision, followUpQuestion: null };
        }
        const followUp = await this.prisma.$transaction(async (transaction) => {
            const session = await transaction.interviewSession.findFirst({
                where: { invitationId: interviewId, vacancyId, candidateId: vacancyCandidate.candidateId },
            });
            if (session === null || session.status !== client_1.InterviewSessionStatus.IN_PROGRESS) {
                throw new common_1.ConflictException('The interview is not available for a follow-up.');
            }
            const unresolvedQuestion = await transaction.interviewQuestionAnswer.findFirst({
                where: { interviewSessionId: session.id, status: client_1.InterviewQuestionStatus.ASKED },
            });
            if (unresolvedQuestion !== null) {
                throw new common_1.ConflictException('The interview has already progressed beyond this core question.');
            }
            const existingFollowUp = await transaction.interviewQuestionAnswer.findFirst({
                where: { followUpFromId: answerId },
                select: { id: true },
            });
            if (existingFollowUp !== null) {
                throw new common_1.ConflictException('A follow-up has already been generated for this core question.');
            }
            return transaction.interviewQuestionAnswer.create({
                data: {
                    interviewSessionId: session.id,
                    followUpFromId: answerId,
                    sequence: coreAnswer.sequence,
                    status: client_1.InterviewQuestionStatus.ASKED,
                    questionText: decision.followUpQuestion,
                    askedAt: new Date(),
                },
            });
        });
        this.logger.log('Interview follow-up generated', {
            event: 'interview_follow_up.generated',
            vacancyId,
            vacancyCandidateId,
            interviewId,
            answerId,
            followUpId: followUp.id,
        });
        return {
            shouldFollowUp: true,
            reason: decision.reason,
            followUpQuestion: {
                id: followUp.id,
                questionText: followUp.questionText,
                sequence: followUp.sequence,
            },
        };
    }
    async findCoreAnswer(vacancyId, candidateId, interviewId, answerId) {
        const answer = await this.prisma.interviewQuestionAnswer.findFirst({
            where: {
                id: answerId,
                status: client_1.InterviewQuestionStatus.ANSWERED,
                followUpFromId: null,
                interviewSession: { invitationId: interviewId, vacancyId, candidateId },
            },
            include: coreAnswerInclude,
        });
        if (answer === null) {
            throw new common_1.NotFoundException('Answered core interview question not found.');
        }
        return answer;
    }
    toFollowUpInput(coreAnswer) {
        if (coreAnswer.vacancyQuestion === null ||
            coreAnswer.answerText === null ||
            coreAnswer.score === null ||
            coreAnswer.explanation === null) {
            throw new common_1.ConflictException('Only evaluated core questions can receive a follow-up.');
        }
        return {
            question: {
                questionText: coreAnswer.questionText,
                evaluationCriteria: coreAnswer.vacancyQuestion.evaluationCriteria,
            },
            answer: {
                text: coreAnswer.answerText,
                evaluation: { score: Number(coreAnswer.score), explanation: coreAnswer.explanation },
            },
        };
    }
    async continueToNextCoreQuestion(interviewId, answerId) {
        await this.prisma.$transaction(async (transaction) => {
            const coreAnswer = await transaction.interviewQuestionAnswer.findFirst({
                where: { id: answerId, interviewSession: { invitationId: interviewId } },
            });
            if (coreAnswer === null) {
                throw new common_1.NotFoundException('Answered core interview question not found.');
            }
            const unresolvedQuestion = await transaction.interviewQuestionAnswer.findFirst({
                where: {
                    interviewSessionId: coreAnswer.interviewSessionId,
                    status: client_1.InterviewQuestionStatus.ASKED,
                },
            });
            if (unresolvedQuestion !== null) {
                throw new common_1.ConflictException('The interview has already progressed beyond this core question.');
            }
            const nextCoreQuestion = await transaction.interviewQuestionAnswer.findFirst({
                where: {
                    interviewSessionId: coreAnswer.interviewSessionId,
                    followUpFromId: null,
                    status: client_1.InterviewQuestionStatus.PENDING,
                },
                orderBy: { sequence: 'asc' },
            });
            if (nextCoreQuestion !== null) {
                await transaction.interviewQuestionAnswer.update({
                    where: { id: nextCoreQuestion.id },
                    data: { status: client_1.InterviewQuestionStatus.ASKED, askedAt: new Date() },
                });
            }
            else {
                await transaction.interviewSession.update({
                    where: { id: coreAnswer.interviewSessionId },
                    data: { status: client_1.InterviewSessionStatus.COMPLETED, completedAt: new Date() },
                });
                await transaction.interviewInvitation.update({
                    where: { id: interviewId },
                    data: { status: 'COMPLETED' },
                });
            }
        });
    }
};
exports.InterviewFollowUpService = InterviewFollowUpService;
exports.InterviewFollowUpService = InterviewFollowUpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(interview_follow_up_types_js_1.INTERVIEW_FOLLOW_UP_LLM_SERVICE)),
    __metadata("design:paramtypes", [Object, prisma_service_js_1.PrismaService,
        vacancy_candidate_service_js_1.VacancyCandidateService,
        structured_logger_service_js_1.StructuredLogger])
], InterviewFollowUpService);
//# sourceMappingURL=interview-follow-up.service.js.map