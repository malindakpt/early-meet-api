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
exports.CandidateRankingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const toRankingInclude = (vacancyId) => ({
    candidate: {
        select: {
            id: true,
            email: true,
            name: true,
            invitations: {
                where: { vacancyId, status: { not: 'CANCELLED' } },
                include: {
                    session: {
                        include: {
                            answers: {
                                where: { followUpFromId: null },
                                orderBy: { sequence: 'asc' },
                                include: {
                                    vacancyQuestion: {
                                        select: {
                                            question: {
                                                select: {
                                                    technology: { select: { name: true } },
                                                    technologySegment: { select: { name: true } },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});
let CandidateRankingService = class CandidateRankingService {
    prisma;
    vacancyService;
    constructor(prisma, vacancyService) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
    }
    async findAll(user, vacancyId, query) {
        await this.vacancyService.findOne(user, vacancyId);
        const candidates = await this.prisma.vacancyCandidate.findMany({
            where: { vacancyId },
            include: toRankingInclude(vacancyId),
            orderBy: { id: 'asc' },
        });
        const rankedCandidates = [];
        const notEvaluatedCandidates = [];
        for (const candidate of candidates) {
            const evaluation = this.findLatestEvaluation(candidate);
            if (evaluation !== null) {
                rankedCandidates.push(this.toRankedCandidate(candidate, evaluation));
            }
            else {
                notEvaluatedCandidates.push(this.toNotEvaluatedCandidate(candidate));
            }
        }
        rankedCandidates.sort((left, right) => right.overallScore - left.overallScore ||
            left.vacancyCandidateId.localeCompare(right.vacancyCandidateId));
        this.assignCompetitionRanks(rankedCandidates);
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const total = rankedCandidates.length;
        return {
            rankedCandidates: rankedCandidates.slice((page - 1) * limit, page * limit),
            notEvaluatedCandidates,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    findLatestEvaluation(candidate) {
        return (candidate.candidate.invitations
            .filter((invitation) => invitation.session?.status === client_1.InterviewSessionStatus.COMPLETED &&
            invitation.session.overallScore !== null &&
            invitation.session.summary !== null &&
            invitation.session.evaluatedAt !== null)
            .sort((left, right) => (right.session?.evaluatedAt?.getTime() ?? 0) -
            (left.session?.evaluatedAt?.getTime() ?? 0) || left.id.localeCompare(right.id))[0] ?? null);
    }
    toRankedCandidate(candidate, invitation) {
        const session = invitation.session;
        if (session === null || session.overallScore === null) {
            throw new Error('A persisted interview evaluation must include a completed session score.');
        }
        const questionScores = session.answers
            .filter((answer) => answer.score !== null)
            .map((answer) => ({
            questionId: answer.vacancyQuestionId,
            questionText: answer.questionText,
            sequence: answer.sequence,
            score: Number(answer.score),
        }));
        return {
            candidate: { ...candidate.candidate, email: candidate.candidate.email ?? '' },
            candidateId: candidate.candidateId,
            vacancyCandidateId: candidate.id,
            interviewId: invitation.id,
            interviewStatus: session.status,
            overallScore: Number(session.overallScore),
            preferredSkillCoverage: this.getPersistedCoverage(session.candidateIntelligence, 'preferredSkills'),
            rank: 0,
            requiredSkillCoverage: this.getPersistedCoverage(session.candidateIntelligence, 'requiredSkills'),
            coreQuestionCount: session.answers.length,
            evaluatedCoreAnswerCount: questionScores.length,
            questionScores,
            technologyScores: this.toTechnologyScores(session.answers),
        };
    }
    toNotEvaluatedCandidate(candidate) {
        const latestInvitation = candidate.candidate.invitations.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || left.id.localeCompare(right.id))[0];
        const session = latestInvitation?.session ?? null;
        return {
            candidate: { ...candidate.candidate, email: candidate.candidate.email ?? '' },
            candidateId: candidate.candidateId,
            vacancyCandidateId: candidate.id,
            interviewId: latestInvitation?.id ?? null,
            interviewStatus: session?.status ?? null,
            evaluationStatus: session?.evaluationStatus ?? null,
            reason: latestInvitation === undefined
                ? 'INTERVIEW_NOT_STARTED'
                : session?.status !== client_1.InterviewSessionStatus.COMPLETED
                    ? 'INTERVIEW_INCOMPLETE'
                    : session?.evaluationStatus === client_1.InterviewEvaluationStatus.FAILED
                        ? 'EVALUATION_FAILED'
                        : 'OVERALL_EVALUATION_PENDING',
        };
    }
    toTechnologyScores(answers) {
        const scoresByTechnology = new Map();
        for (const answer of answers) {
            const technology = answer.vacancyQuestion?.question.technology.name;
            if (technology !== undefined && answer.score !== null) {
                const scores = scoresByTechnology.get(technology) ?? [];
                scores.push(Number(answer.score));
                scoresByTechnology.set(technology, scores);
            }
        }
        return [...scoresByTechnology.entries()]
            .map(([technology, scores]) => ({
            technology,
            averageScore: Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(2)),
            evaluatedCoreQuestionCount: scores.length,
        }))
            .sort((left, right) => left.technology.localeCompare(right.technology));
    }
    assignCompetitionRanks(candidates) {
        let previousScore = null;
        let rank = 0;
        for (const [index, candidate] of candidates.entries()) {
            if (candidate.overallScore !== previousScore) {
                rank = index + 1;
                previousScore = candidate.overallScore;
            }
            candidate.rank = rank;
        }
    }
    getPersistedCoverage(candidateIntelligence, requirementType) {
        if (candidateIntelligence === null ||
            typeof candidateIntelligence !== 'object' ||
            Array.isArray(candidateIntelligence) ||
            !(requirementType in candidateIntelligence)) {
            return null;
        }
        const requirement = candidateIntelligence[requirementType];
        if (requirement === null ||
            typeof requirement !== 'object' ||
            Array.isArray(requirement) ||
            !('coverage' in requirement) ||
            typeof requirement.coverage !== 'number') {
            return null;
        }
        return requirement.coverage;
    }
};
exports.CandidateRankingService = CandidateRankingService;
exports.CandidateRankingService = CandidateRankingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService])
], CandidateRankingService);
//# sourceMappingURL=candidate-ranking.service.js.map