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
exports.InterviewAnswerEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const interview_answer_evaluation_types_js_1 = require("../ai/interview-answer-evaluation.types.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const vacancy_candidate_service_js_1 = require("../vacancy-candidates/vacancy-candidate.service.js");
const answerInclude = {
    vacancyQuestion: {
        select: {
            difficulty: true,
            evaluationCriteria: true,
            questionType: true,
        },
    },
    vacancyCustomQuestion: { select: { evaluationCriteria: true } },
    followUpFrom: {
        select: {
            vacancyQuestion: {
                select: {
                    difficulty: true,
                    evaluationCriteria: true,
                    questionType: true,
                },
            },
        },
    },
};
let InterviewAnswerEvaluationService = class InterviewAnswerEvaluationService {
    evaluationLlmService;
    prisma;
    vacancyCandidateService;
    logger;
    constructor(evaluationLlmService, prisma, vacancyCandidateService, logger) {
        this.evaluationLlmService = evaluationLlmService;
        this.prisma = prisma;
        this.vacancyCandidateService = vacancyCandidateService;
        this.logger = logger;
    }
    async evaluate(user, vacancyId, vacancyCandidateId, interviewId, answerId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const answer = await this.findAnsweredAnswer(vacancyId, vacancyCandidate.candidateId, interviewId, answerId);
        if (answer.score !== null || answer.explanation !== null) {
            throw new common_1.ConflictException('This interview answer has already been evaluated.');
        }
        if ((answer.vacancyQuestion === null &&
            answer.vacancyCustomQuestion === null &&
            answer.followUpFrom?.vacancyQuestion === null) ||
            answer.answerText === null) {
            throw new common_1.ConflictException('Only answered interview questions can be evaluated.');
        }
        const evaluation = await this.evaluationLlmService.evaluate(this.toEvaluationInput(answer));
        const result = await this.prisma.interviewQuestionAnswer.updateMany({
            where: { id: answer.id, score: null, explanation: null },
            data: { score: evaluation.score, explanation: evaluation.explanation },
        });
        if (result.count !== 1) {
            throw new common_1.ConflictException('This interview answer has already been evaluated.');
        }
        this.logger.log('Interview answer evaluation completed', {
            event: 'interview_answer.evaluation.completed',
            vacancyId,
            vacancyCandidateId,
            interviewId,
            answerId,
        });
        return { answerId, score: evaluation.score, explanation: evaluation.explanation };
    }
    async findAnsweredAnswer(vacancyId, candidateId, interviewId, answerId) {
        const answer = await this.prisma.interviewQuestionAnswer.findFirst({
            where: {
                id: answerId,
                status: client_1.InterviewQuestionStatus.ANSWERED,
                interviewSession: { invitationId: interviewId, vacancyId, candidateId },
            },
            include: answerInclude,
        });
        if (answer === null) {
            throw new common_1.NotFoundException('Answered interview question not found.');
        }
        return answer;
    }
    toEvaluationInput(answer) {
        const vacancyQuestion = answer.vacancyQuestion ?? answer.followUpFrom?.vacancyQuestion;
        if ((vacancyQuestion === null || vacancyQuestion === undefined) &&
            answer.vacancyCustomQuestion === null) {
            throw new common_1.ConflictException('Only answered interview questions can be evaluated.');
        }
        if (answer.answerText === null)
            throw new common_1.ConflictException('Only answered interview questions can be evaluated.');
        return {
            answerText: answer.answerText,
            question: {
                questionText: answer.questionText,
                difficulty: vacancyQuestion?.difficulty ?? 'CUSTOM',
                questionType: vacancyQuestion?.questionType ?? 'CUSTOM',
                evaluationCriteria: vacancyQuestion?.evaluationCriteria ?? answer.vacancyCustomQuestion?.evaluationCriteria ?? null,
            },
        };
    }
};
exports.InterviewAnswerEvaluationService = InterviewAnswerEvaluationService;
exports.InterviewAnswerEvaluationService = InterviewAnswerEvaluationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(interview_answer_evaluation_types_js_1.INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE)),
    __metadata("design:paramtypes", [Object, prisma_service_js_1.PrismaService,
        vacancy_candidate_service_js_1.VacancyCandidateService,
        structured_logger_service_js_1.StructuredLogger])
], InterviewAnswerEvaluationService);
//# sourceMappingURL=interview-answer-evaluation.service.js.map