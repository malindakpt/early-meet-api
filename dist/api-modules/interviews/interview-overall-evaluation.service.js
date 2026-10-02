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
exports.InterviewOverallEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const interview_overall_evaluation_types_js_1 = require("../ai/interview-overall-evaluation.types.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const vacancy_candidate_service_js_1 = require("../vacancy-candidates/vacancy-candidate.service.js");
const sessionInclude = {
    vacancy: {
        select: {
            difficulty: true,
            interviewType: true,
            jobDescription: true,
            title: true,
            technologies: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    requirementType: true,
                    segmentSelections: true,
                    technology: { select: { name: true } },
                },
            },
        },
    },
    answers: {
        orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
        include: {
            followUpFrom: { select: { id: true } },
            vacancyQuestion: {
                select: {
                    difficulty: true,
                    evaluationCriteria: true,
                    questionType: true,
                    question: {
                        select: {
                            technology: { select: { name: true } },
                            technologySegment: { select: { name: true } },
                        },
                    },
                },
            },
            vacancyCustomQuestion: { select: { evaluationCriteria: true } },
        },
    },
};
const levelWeights = {
    STRONG: 1,
    GOOD: 0.75,
    MODERATE: 0.5,
    WEAK: 0.25,
    NO_EVIDENCE: 0,
};
let InterviewOverallEvaluationService = class InterviewOverallEvaluationService {
    overallEvaluationLlmService;
    prisma;
    vacancyCandidateService;
    logger;
    constructor(overallEvaluationLlmService, prisma, vacancyCandidateService, logger) {
        this.overallEvaluationLlmService = overallEvaluationLlmService;
        this.prisma = prisma;
        this.vacancyCandidateService = vacancyCandidateService;
        this.logger = logger;
    }
    async evaluate(user, vacancyId, vacancyCandidateId, interviewId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const session = await this.findSession(interviewId);
        if (session.vacancyId !== vacancyId || session.candidateId !== vacancyCandidate.candidateId) {
            throw new common_1.NotFoundException('Interview session not found.');
        }
        return this.evaluateSession(session);
    }
    async evaluateForInterview(interviewId) {
        await this.evaluateSession(await this.findSession(interviewId));
    }
    async findOne(user, vacancyId, vacancyCandidateId, interviewId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const session = await this.findSession(interviewId);
        if (session.vacancyId !== vacancyId || session.candidateId !== vacancyCandidate.candidateId) {
            throw new common_1.NotFoundException('Interview session not found.');
        }
        if (session.evaluationStatus !== client_1.InterviewEvaluationStatus.EVALUATED ||
            session.overallScore === null ||
            session.summary === null ||
            session.candidateIntelligence === null) {
            throw new common_1.NotFoundException('Overall interview evaluation not found.');
        }
        return this.toStoredResponse(session);
    }
    async evaluateSession(session) {
        if (session.evaluationStatus === client_1.InterviewEvaluationStatus.EVALUATED)
            return this.toStoredResponse(session);
        this.assertReadyForEvaluation(session);
        const claim = await this.prisma.interviewSession.updateMany({
            where: {
                id: session.id,
                status: client_1.InterviewSessionStatus.COMPLETED,
                evaluationStatus: {
                    in: [client_1.InterviewEvaluationStatus.NOT_STARTED, client_1.InterviewEvaluationStatus.FAILED],
                },
            },
            data: {
                evaluationStartedAt: new Date(),
                evaluationStatus: client_1.InterviewEvaluationStatus.EVALUATING,
            },
        });
        if (claim.count !== 1)
            throw new common_1.ConflictException('Interview evaluation is already in progress.');
        try {
            const evaluation = await this.overallEvaluationLlmService.evaluate(this.toEvaluationInput(session));
            const candidateIntelligence = this.toCandidateIntelligence(session, evaluation);
            const overallScore = this.calculateOverallScore(candidateIntelligence);
            const evaluatedAt = new Date();
            const result = await this.prisma.interviewSession.updateMany({
                where: { id: session.id, evaluationStatus: client_1.InterviewEvaluationStatus.EVALUATING },
                data: {
                    candidateIntelligence: candidateIntelligence,
                    evaluatedAt,
                    evaluationStatus: client_1.InterviewEvaluationStatus.EVALUATED,
                    overallScore,
                    summary: evaluation.summary,
                },
            });
            if (result.count !== 1)
                throw new Error('Interview evaluation state changed before persistence.');
            this.logger.log('Whole interview evaluation completed', {
                event: 'interview.evaluation.completed',
                interviewId: session.invitationId,
                sessionId: session.id,
            });
            return {
                candidateIntelligence,
                evaluatedAt,
                interviewId: session.invitationId,
                overallScore,
                summary: evaluation.summary,
            };
        }
        catch (error) {
            await this.prisma.interviewSession.updateMany({
                where: { id: session.id, evaluationStatus: client_1.InterviewEvaluationStatus.EVALUATING },
                data: { evaluationStatus: client_1.InterviewEvaluationStatus.FAILED },
            });
            this.logger.error('Whole interview evaluation failed', {
                event: 'interview.evaluation.failed',
                interviewId: session.invitationId,
                sessionId: session.id,
                error: (0, error_serializer_js_1.serializeError)(error),
            });
            throw error;
        }
    }
    assertReadyForEvaluation(session) {
        if (session.status !== client_1.InterviewSessionStatus.COMPLETED) {
            throw new common_1.ConflictException('Only a completed interview can receive an overall evaluation.');
        }
        const coreAnswers = session.answers.filter((answer) => answer.followUpFromId === null);
        if (coreAnswers.length === 0 ||
            coreAnswers.some((answer) => answer.status !== client_1.InterviewQuestionStatus.ANSWERED || answer.answerText === null)) {
            throw new common_1.ConflictException('All core interview answers must be completed first.');
        }
    }
    toEvaluationInput(session) {
        return {
            vacancy: {
                description: session.vacancy.jobDescription,
                difficulty: session.vacancy.difficulty,
                interviewType: session.vacancy.interviewType,
                skills: session.vacancy.technologies.map((skill) => ({
                    name: skill.technology.name,
                    requirementType: skill.requirementType,
                    segmentName: this.toSegmentLabel(skill.segmentSelections),
                    vacancyTechnologyId: skill.id,
                })),
                title: session.vacancy.title,
            },
            coreAnswers: session.answers
                .filter((answer) => answer.followUpFromId === null && answer.answerText !== null)
                .map((answer) => ({
                answerText: answer.answerText,
                questionId: answer.id,
                sequence: answer.sequence,
                question: {
                    difficulty: answer.vacancyQuestion?.difficulty ?? session.vacancy.difficulty,
                    evaluationCriteria: answer.vacancyQuestion?.evaluationCriteria ??
                        answer.vacancyCustomQuestion?.evaluationCriteria ??
                        null,
                    questionText: answer.questionText,
                    questionType: answer.vacancyQuestion?.questionType ?? 'CUSTOM',
                    technology: answer.vacancyQuestion?.question.technology.name ?? null,
                    technologySegment: answer.vacancyQuestion?.question.technologySegment.name ?? null,
                },
            })),
            followUpAnswers: session.answers
                .filter((answer) => answer.followUpFromId !== null &&
                answer.answerText !== null &&
                answer.status === client_1.InterviewQuestionStatus.ANSWERED)
                .map((answer) => ({
                answerText: answer.answerText,
                parentCoreQuestionId: answer.followUpFrom?.id ?? answer.followUpFromId,
                questionId: answer.id,
                questionText: answer.questionText,
            })),
        };
    }
    toCandidateIntelligence(session, evaluation) {
        const validQuestionIds = new Set(session.answers.map((answer) => answer.id));
        if (evaluation.strengths.some((item) => item.questionIds.some((id) => !validQuestionIds.has(id))) ||
            evaluation.areasToProbe.some((item) => item.questionIds.some((id) => !validQuestionIds.has(id)))) {
            throw new common_1.ConflictException('Interview evaluation referenced an unknown question.');
        }
        const configuredSkills = new Map(session.vacancy.technologies.map((skill) => [skill.id, skill]));
        if (evaluation.skills.length !== configuredSkills.size ||
            new Set(evaluation.skills.map((skill) => skill.vacancyTechnologyId)).size !==
                configuredSkills.size ||
            evaluation.skills.some((skill) => !configuredSkills.has(skill.vacancyTechnologyId))) {
            throw new common_1.ConflictException('Interview evaluation did not match configured vacancy skills.');
        }
        const assessments = evaluation.skills.map((assessment) => {
            const skill = configuredSkills.get(assessment.vacancyTechnologyId);
            if (skill === undefined)
                throw new common_1.ConflictException('Interview evaluation referenced an unconfigured skill.');
            return {
                ...assessment,
                technology: skill.technology.name,
                technologySegment: this.toSegmentLabel(skill.segmentSelections),
            };
        });
        return {
            areasToProbe: evaluation.areasToProbe,
            competencies: evaluation.competencies,
            preferredSkills: this.toSkillCoverage(assessments, session, client_1.RequirementType.PREFERRED),
            requiredSkills: this.toSkillCoverage(assessments, session, client_1.RequirementType.REQUIRED),
            strengths: evaluation.strengths,
        };
    }
    toSkillCoverage(assessments, session, requirementType) {
        const ids = new Set(session.vacancy.technologies
            .filter((skill) => skill.requirementType === requirementType)
            .map((skill) => skill.id));
        const skills = assessments.filter((assessment) => ids.has(assessment.vacancyTechnologyId));
        const coverage = skills.length === 0
            ? 0
            : (skills.reduce((total, skill) => total + levelWeights[skill.level], 0) / skills.length) *
                100;
        return { coverage: Number(coverage.toFixed(2)), skills };
    }
    toSegmentLabel(segmentSelections) {
        if (segmentSelections.includes('ALL'))
            return 'All Segments';
        if (segmentSelections.length === 0)
            return null;
        return `${segmentSelections.length} segments selected`;
    }
    calculateOverallScore(intelligence) {
        return intelligence.requiredSkills.skills.length > 0
            ? intelligence.requiredSkills.coverage
            : intelligence.preferredSkills.coverage;
    }
    async findSession(interviewId) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { invitationId: interviewId },
            include: sessionInclude,
        });
        if (session === null)
            throw new common_1.NotFoundException('Interview session not found.');
        return session;
    }
    toStoredResponse(session) {
        return {
            candidateIntelligence: session.candidateIntelligence,
            evaluatedAt: session.evaluatedAt,
            interviewId: session.invitationId,
            overallScore: Number(session.overallScore),
            summary: session.summary,
        };
    }
};
exports.InterviewOverallEvaluationService = InterviewOverallEvaluationService;
exports.InterviewOverallEvaluationService = InterviewOverallEvaluationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(interview_overall_evaluation_types_js_1.INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE)),
    __metadata("design:paramtypes", [Object, prisma_service_js_1.PrismaService,
        vacancy_candidate_service_js_1.VacancyCandidateService,
        structured_logger_service_js_1.StructuredLogger])
], InterviewOverallEvaluationService);
//# sourceMappingURL=interview-overall-evaluation.service.js.map