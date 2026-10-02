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
exports.InterviewService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const auth_token_service_js_1 = require("../auth/auth-token.service.js");
const interview_invitation_email_service_js_1 = require("../email/interview-invitation-email.service.js");
const vacancy_candidate_service_js_1 = require("../vacancy-candidates/vacancy-candidate.service.js");
const interview_evaluation_scheduler_service_js_1 = require("./interview-evaluation-scheduler.service.js");
const invitationInclude = {
    candidate: { select: { id: true, name: true, email: true, phone: true, status: true } },
    vacancy: { select: { id: true, title: true, status: true } },
};
const reviewInclude = {
    candidate: { select: { email: true, name: true } },
    vacancy: {
        select: {
            id: true,
            title: true,
            candidates: { select: { candidateId: true, id: true } },
        },
    },
    session: {
        select: {
            candidateIntelligence: true,
            completedAt: true,
            evaluationStatus: true,
            evaluatedAt: true,
            overallScore: true,
            startedAt: true,
            status: true,
            summary: true,
            answers: {
                orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
                select: {
                    answerText: true,
                    explanation: true,
                    followUpFromId: true,
                    id: true,
                    questionText: true,
                    score: true,
                    sequence: true,
                    status: true,
                },
            },
        },
    },
};
let InterviewService = class InterviewService {
    prisma;
    vacancyCandidateService;
    authTokenService;
    invitationNotificationService;
    interviewEvaluationScheduler;
    constructor(prisma, vacancyCandidateService, authTokenService, invitationNotificationService, interviewEvaluationScheduler) {
        this.prisma = prisma;
        this.vacancyCandidateService = vacancyCandidateService;
        this.authTokenService = authTokenService;
        this.invitationNotificationService = invitationNotificationService;
        this.interviewEvaluationScheduler = interviewEvaluationScheduler;
    }
    async create(user, vacancyId, vacancyCandidateId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const token = this.authTokenService.createOpaqueToken();
        const invitation = await this.prisma.interviewInvitation.create({
            data: {
                candidateId: vacancyCandidate.candidateId,
                vacancyId,
                createdBy: user.id,
                tokenHash: this.authTokenService.hashOpaqueToken(token),
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                status: client_1.InvitationStatus.PENDING,
            },
            include: invitationInclude,
        });
        return { ...this.toResponse(invitation), token };
    }
    async sendInvitation(user, vacancyId, vacancyCandidateId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        if (vacancyCandidate.candidate.status !== 'ACTIVE') {
            throw new common_1.ConflictException('Only active candidates can be invited to an interview.');
        }
        if (vacancyCandidate.candidate.processingStatus !== client_1.CandidateProcessingStatus.READY) {
            throw new common_1.ConflictException('Process the candidate CV before sending an interview invitation.');
        }
        if (vacancyCandidate.candidate.email === null) {
            throw new common_1.ConflictException('Add a candidate email before sending an interview invitation.');
        }
        const candidateEmail = vacancyCandidate.candidate.email;
        const vacancy = await this.prisma.vacancy.findUnique({
            where: { id: vacancyId },
            select: { title: true },
        });
        if (vacancy === null) {
            throw new common_1.ConflictException('The vacancy is unavailable.');
        }
        const [technicalQuestionCount, customQuestionCount] = await Promise.all([
            this.prisma.vacancyQuestion.count({ where: { vacancyId } }),
            this.prisma.vacancyCustomQuestion.count({ where: { vacancyId } }),
        ]);
        if (technicalQuestionCount + customQuestionCount === 0) {
            throw new common_1.ConflictException('An interview requires at least one vacancy question.');
        }
        const existingInvitation = await this.prisma.interviewInvitation.findFirst({
            where: {
                candidateId: vacancyCandidate.candidateId,
                vacancyId,
                status: { in: [client_1.InvitationStatus.PENDING, client_1.InvitationStatus.SENT, client_1.InvitationStatus.OPENED] },
            },
        });
        if (existingInvitation !== null) {
            throw new common_1.ConflictException('An active interview invitation already exists for this candidate.');
        }
        const estimatedInterviewTimeSeconds = await this.getEstimatedInterviewTimeSeconds(vacancyId);
        const token = this.authTokenService.createOpaqueToken();
        const invitation = await this.prisma.interviewInvitation.create({
            data: {
                candidateId: vacancyCandidate.candidateId,
                vacancyId,
                createdBy: user.id,
                tokenHash: this.authTokenService.hashOpaqueToken(token),
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                status: client_1.InvitationStatus.PENDING,
            },
            include: invitationInclude,
        });
        try {
            await this.invitationNotificationService.send({
                candidateEmail,
                candidateName: invitation.candidate.name,
                estimatedInterviewTimeSeconds,
                token,
                vacancyTitle: vacancy.title,
            });
        }
        catch (error) {
            await this.prisma.interviewInvitation.delete({ where: { id: invitation.id } });
            throw error;
        }
        return this.toResponse(await this.prisma.interviewInvitation.update({
            where: { id: invitation.id },
            data: { sentAt: new Date(), status: client_1.InvitationStatus.SENT },
            include: invitationInclude,
        }));
    }
    async findAll(user, vacancyId, vacancyCandidateId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const invitations = await this.prisma.interviewInvitation.findMany({
            where: { vacancyId, candidateId: vacancyCandidate.candidateId },
            include: invitationInclude,
            orderBy: { createdAt: 'desc' },
        });
        return invitations.map((invitation) => this.toResponse(invitation));
    }
    async findAllForReview(user) {
        const interviews = await this.prisma.interviewInvitation.findMany({
            where: { vacancy: { organizationId: user.organizationId } },
            include: reviewInclude,
            orderBy: { createdAt: 'desc' },
        });
        return interviews.map((interview) => this.toReviewListItem(interview));
    }
    async findOneForReview(user, interviewId) {
        const interview = await this.prisma.interviewInvitation.findFirst({
            where: { id: interviewId, vacancy: { organizationId: user.organizationId } },
            include: reviewInclude,
        });
        if (interview === null)
            throw new common_1.NotFoundException('Interview not found.');
        const listItem = this.toReviewListItem(interview);
        const session = interview.session;
        return {
            ...listItem,
            completedAt: session?.completedAt ?? null,
            evaluation: session?.overallScore === null ||
                session?.overallScore === undefined ||
                session.summary === null ||
                session.evaluatedAt === null ||
                session.candidateIntelligence === null
                ? null
                : {
                    candidateIntelligence: session.candidateIntelligence,
                    evaluatedAt: session.evaluatedAt,
                    overallScore: Number(session.overallScore),
                    summary: session.summary,
                },
            evaluationStatus: session?.evaluationStatus ?? null,
            questions: session?.answers.map((answer) => ({
                ...answer,
                score: answer.score === null ? null : Number(answer.score),
            })) ?? [],
            sessionStatus: session?.status ?? null,
            startedAt: session?.startedAt ?? null,
        };
    }
    async removeForReview(user, interviewId) {
        const interview = await this.prisma.interviewInvitation.findFirst({
            where: { id: interviewId, vacancy: { organizationId: user.organizationId } },
            select: { id: true },
        });
        if (interview === null)
            throw new common_1.NotFoundException('Interview not found.');
        await this.prisma.$transaction(async (transaction) => {
            const session = await transaction.interviewSession.findUnique({
                where: { invitationId: interview.id },
                select: { id: true },
            });
            if (session !== null) {
                await transaction.interviewQuestionAnswer.updateMany({
                    where: { interviewSessionId: session.id, followUpFromId: { not: null } },
                    data: { followUpFromId: null },
                });
                await transaction.interviewQuestionAnswer.deleteMany({
                    where: { interviewSessionId: session.id },
                });
                await transaction.interviewSession.delete({ where: { id: session.id } });
            }
            await transaction.interviewInvitation.delete({ where: { id: interview.id } });
        });
    }
    async findOne(user, vacancyId, vacancyCandidateId, interviewId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        return this.toResponse(await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId));
    }
    async update(user, vacancyId, vacancyCandidateId, interviewId, dto) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const invitation = await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId);
        if (dto.status !== client_1.InvitationStatus.CANCELLED ||
            invitation.status !== client_1.InvitationStatus.PENDING) {
            throw new common_1.ConflictException('Only a pending interview invitation can be cancelled by HR.');
        }
        return this.toResponse(await this.prisma.interviewInvitation.update({
            where: { id: interviewId },
            data: { status: client_1.InvitationStatus.CANCELLED },
            include: invitationInclude,
        }));
    }
    async start(user, vacancyId, vacancyCandidateId, interviewId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const invitation = await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId);
        return this.startInvitation(invitation);
    }
    async getCandidateProgress(token) {
        const invitation = await this.findCandidateInvitation(token);
        const session = await this.prisma.interviewSession.findUnique({
            where: { invitationId: invitation.id },
        });
        if (session === null) {
            return this.toCandidateProgress(invitation, null, []);
        }
        const questions = await this.prisma.interviewQuestionAnswer.findMany({
            where: { interviewSessionId: session.id },
            orderBy: { sequence: 'asc' },
        });
        return this.toCandidateProgress(invitation, session, questions);
    }
    async startCandidateInterview(token) {
        const invitation = await this.findCandidateInvitation(token);
        const progress = await this.startInvitation(invitation);
        return this.toCandidateProgressFromProgress(invitation, progress);
    }
    async submitCandidateAnswer(token, dto) {
        const invitation = await this.findCandidateInvitation(token);
        const progress = await this.submitAnswerForInvitation(invitation, dto);
        return this.toCandidateProgressFromProgress(invitation, progress);
    }
    async startInvitation(invitation) {
        if (invitation.status !== client_1.InvitationStatus.PENDING &&
            invitation.status !== client_1.InvitationStatus.SENT) {
            throw new common_1.ConflictException('Only a sent interview invitation can be started.');
        }
        const vacancyQuestions = await this.prisma.vacancyQuestion.findMany({
            where: { vacancyId: invitation.vacancyId },
            orderBy: { sequence: 'asc' },
        });
        const customQuestions = await this.prisma.vacancyCustomQuestion.findMany({
            where: { vacancyId: invitation.vacancyId },
            orderBy: { displayOrder: 'asc' },
        });
        if (vacancyQuestions.length + customQuestions.length === 0) {
            throw new common_1.ConflictException('An interview requires at least one vacancy question.');
        }
        return this.prisma.$transaction(async (transaction) => {
            const existingSession = await transaction.interviewSession.findUnique({
                where: { invitationId: invitation.id },
                select: { id: true },
            });
            if (existingSession !== null) {
                throw new common_1.ConflictException('The interview has already started.');
            }
            const startedAt = new Date();
            const session = await transaction.interviewSession.create({
                data: {
                    invitationId: invitation.id,
                    candidateId: invitation.candidateId,
                    vacancyId: invitation.vacancyId,
                    status: client_1.InterviewSessionStatus.IN_PROGRESS,
                    startedAt,
                    answers: {
                        create: [
                            ...vacancyQuestions.map((question) => ({
                                vacancyQuestionId: question.id,
                                sequence: question.sequence,
                                status: question.sequence === 1
                                    ? client_1.InterviewQuestionStatus.ASKED
                                    : client_1.InterviewQuestionStatus.PENDING,
                                questionText: question.questionText,
                                askedAt: question.sequence === 1 ? startedAt : null,
                            })),
                            ...customQuestions.map((question, index) => ({
                                vacancyCustomQuestionId: question.id,
                                sequence: vacancyQuestions.length + index + 1,
                                status: vacancyQuestions.length === 0 && index === 0
                                    ? client_1.InterviewQuestionStatus.ASKED
                                    : client_1.InterviewQuestionStatus.PENDING,
                                questionText: question.questionText,
                                askedAt: vacancyQuestions.length === 0 && index === 0 ? startedAt : null,
                            })),
                        ],
                    },
                },
            });
            await transaction.interviewInvitation.update({
                where: { id: invitation.id },
                data: { status: client_1.InvitationStatus.OPENED },
            });
            const questions = await transaction.interviewQuestionAnswer.findMany({
                where: { interviewSessionId: session.id },
                orderBy: { sequence: 'asc' },
            });
            return this.toProgress(invitation.id, session, questions);
        });
    }
    async getProgress(user, vacancyId, vacancyCandidateId, interviewId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId);
        const session = await this.findSession(vacancyId, vacancyCandidate.candidateId, interviewId);
        const questions = await this.prisma.interviewQuestionAnswer.findMany({
            where: { interviewSessionId: session.id },
            orderBy: { sequence: 'asc' },
        });
        return this.toProgress(interviewId, session, questions);
    }
    async submitAnswer(user, vacancyId, vacancyCandidateId, interviewId, dto) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const invitation = await this.findInvitation(vacancyId, vacancyCandidate.candidateId, interviewId);
        return this.submitAnswerForInvitation(invitation, dto);
    }
    async submitAnswerForInvitation(invitation, dto) {
        const result = await this.prisma.$transaction(async (transaction) => {
            const session = await transaction.interviewSession.findFirst({
                where: {
                    invitationId: invitation.id,
                    vacancyId: invitation.vacancyId,
                    candidateId: invitation.candidateId,
                },
            });
            if (session === null) {
                throw new common_1.NotFoundException('Interview session not found.');
            }
            if (session.status !== client_1.InterviewSessionStatus.IN_PROGRESS) {
                throw new common_1.ConflictException('Only an in-progress interview can accept answers.');
            }
            const submittedQuestion = await transaction.interviewQuestionAnswer.findFirst({
                where: { id: dto.interviewQuestionId, interviewSessionId: session.id },
            });
            if (submittedQuestion === null) {
                throw new common_1.NotFoundException('Interview question not found.');
            }
            if (submittedQuestion.status === client_1.InterviewQuestionStatus.ANSWERED) {
                throw new common_1.ConflictException('This interview question has already been answered.');
            }
            const currentQuestion = await transaction.interviewQuestionAnswer.findFirst({
                where: { interviewSessionId: session.id, status: client_1.InterviewQuestionStatus.ASKED },
                orderBy: { sequence: 'asc' },
            });
            if (currentQuestion === null || currentQuestion.id !== submittedQuestion.id) {
                throw new common_1.ConflictException('Answers must be submitted in question order.');
            }
            await transaction.interviewQuestionAnswer.update({
                where: { id: submittedQuestion.id },
                data: {
                    answerText: dto.answerText,
                    status: client_1.InterviewQuestionStatus.ANSWERED,
                    answeredAt: new Date(),
                },
            });
            const nextQuestion = await transaction.interviewQuestionAnswer.findFirst({
                where: {
                    interviewSessionId: session.id,
                    followUpFromId: null,
                    status: client_1.InterviewQuestionStatus.PENDING,
                },
                orderBy: { sequence: 'asc' },
            });
            const updatedSession = nextQuestion === null
                ? await transaction.interviewSession.update({
                    where: { id: session.id },
                    data: { status: client_1.InterviewSessionStatus.COMPLETED, completedAt: new Date() },
                })
                : session;
            if (nextQuestion === null) {
                await transaction.interviewInvitation.update({
                    where: { id: invitation.id },
                    data: { status: client_1.InvitationStatus.COMPLETED },
                });
            }
            else {
                await transaction.interviewQuestionAnswer.update({
                    where: { id: nextQuestion.id },
                    data: { status: client_1.InterviewQuestionStatus.ASKED, askedAt: new Date() },
                });
            }
            const questions = await transaction.interviewQuestionAnswer.findMany({
                where: { interviewSessionId: session.id },
                orderBy: { sequence: 'asc' },
            });
            return {
                progress: this.toProgress(invitation.id, updatedSession, questions),
                shouldScheduleEvaluation: nextQuestion === null,
            };
        });
        if (result.shouldScheduleEvaluation)
            this.interviewEvaluationScheduler?.schedule(invitation.id);
        return result.progress;
    }
    async findCandidateInvitation(token) {
        const invitation = await this.prisma.interviewInvitation.findFirst({
            where: { tokenHash: this.authTokenService.hashOpaqueToken(token) },
            include: invitationInclude,
        });
        if (invitation === null || invitation.status === client_1.InvitationStatus.CANCELLED) {
            throw new common_1.NotFoundException('Interview invitation not found.');
        }
        if (invitation.expiresAt.getTime() <= Date.now() ||
            invitation.status === client_1.InvitationStatus.EXPIRED) {
            throw new common_1.GoneException('This interview invitation has expired.');
        }
        return invitation;
    }
    async findInvitation(vacancyId, candidateId, interviewId) {
        const invitation = await this.prisma.interviewInvitation.findFirst({
            where: { id: interviewId, vacancyId, candidateId },
            include: invitationInclude,
        });
        if (invitation === null) {
            throw new common_1.NotFoundException('Interview invitation not found.');
        }
        return invitation;
    }
    async findSession(vacancyId, candidateId, interviewId) {
        const session = await this.prisma.interviewSession.findFirst({
            where: { invitationId: interviewId, vacancyId, candidateId },
        });
        if (session === null) {
            throw new common_1.NotFoundException('Interview session not found.');
        }
        return session;
    }
    toProgress(interviewId, session, questions) {
        const currentQuestion = questions.find((question) => question.status === client_1.InterviewQuestionStatus.ASKED);
        return {
            interviewId,
            sessionId: session.id,
            status: session.status,
            totalCoreQuestionCount: questions.filter((question) => question.followUpFromId === null)
                .length,
            answeredQuestionCount: questions.filter((question) => question.status === client_1.InterviewQuestionStatus.ANSWERED).length,
            isComplete: session.status === client_1.InterviewSessionStatus.COMPLETED,
            currentQuestion: currentQuestion === undefined
                ? null
                : {
                    id: currentQuestion.id,
                    sequence: currentQuestion.sequence,
                    questionText: currentQuestion.questionText,
                },
        };
    }
    toReviewListItem(interview) {
        const vacancyCandidate = interview.vacancy.candidates.find((candidate) => candidate.candidateId === interview.candidateId);
        if (vacancyCandidate === undefined) {
            throw new common_1.NotFoundException('Vacancy candidate not found.');
        }
        return {
            candidate: { ...interview.candidate, email: interview.candidate.email ?? '' },
            completedAt: interview.session?.completedAt ?? null,
            createdAt: interview.createdAt,
            id: interview.id,
            overallScore: interview.session?.overallScore === null || interview.session?.overallScore === undefined
                ? null
                : Number(interview.session.overallScore),
            sentAt: interview.sentAt,
            status: interview.status,
            vacancy: { id: interview.vacancy.id, title: interview.vacancy.title },
            vacancyCandidateId: vacancyCandidate.id,
        };
    }
    async toCandidateProgress(invitation, session, questions) {
        const estimatedInterviewTimeSeconds = await this.getEstimatedInterviewTimeSeconds(invitation.vacancyId);
        if (session === null) {
            return {
                answeredQuestionCount: 0,
                currentQuestion: null,
                estimatedInterviewTimeSeconds,
                isComplete: false,
                status: client_1.InterviewSessionStatus.NOT_STARTED,
                totalCoreQuestionCount: 0,
                vacancyTitle: invitation.vacancy.title,
            };
        }
        return this.toCandidateProgressFromProgress(invitation, this.toProgress(invitation.id, session, questions), estimatedInterviewTimeSeconds);
    }
    async toCandidateProgressFromProgress(invitation, progress, estimatedInterviewTimeSeconds) {
        return {
            answeredQuestionCount: progress.answeredQuestionCount,
            currentQuestion: progress.currentQuestion,
            estimatedInterviewTimeSeconds: estimatedInterviewTimeSeconds ??
                (await this.getEstimatedInterviewTimeSeconds(invitation.vacancyId)),
            isComplete: progress.isComplete,
            status: progress.status,
            totalCoreQuestionCount: progress.totalCoreQuestionCount,
            vacancyTitle: invitation.vacancy.title,
        };
    }
    async getEstimatedInterviewTimeSeconds(vacancyId) {
        const questions = await this.prisma.vacancyQuestion.findMany({
            where: { vacancyId },
            select: { question: { select: { estimatedAnswerTimeSeconds: true } } },
        });
        return questions.reduce((total, vacancyQuestion) => total + vacancyQuestion.question.estimatedAnswerTimeSeconds, 0);
    }
    toResponse(invitation) {
        const response = { ...invitation };
        delete response.tokenHash;
        return response;
    }
};
exports.InterviewService = InterviewService;
exports.InterviewService = InterviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(interview_invitation_email_service_js_1.INTERVIEW_INVITATION_NOTIFICATION_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_candidate_service_js_1.VacancyCandidateService,
        auth_token_service_js_1.AuthTokenService, Object, interview_evaluation_scheduler_service_js_1.InterviewEvaluationScheduler])
], InterviewService);
//# sourceMappingURL=interview.service.js.map