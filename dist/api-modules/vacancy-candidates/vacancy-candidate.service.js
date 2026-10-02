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
exports.VacancyCandidateService = void 0;
exports.toUploadTimestampName = toUploadTimestampName;
const class_validator_1 = require("class-validator");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const candidate_service_js_1 = require("../candidates/candidate.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const vacancy_technology_service_js_1 = require("../vacancy-technologies/vacancy-technology.service.js");
const keyword_cv_match_js_1 = require("./keyword-cv-match.js");
const cv_extraction_types_js_1 = require("../ai/cv-extraction.types.js");
const vacancy_candidate_list_query_dto_js_1 = require("./dto/vacancy-candidate-list-query.dto.js");
const interviewInvitationSummarySelect = {
    createdAt: true,
    expiresAt: true,
    id: true,
    sentAt: true,
    status: true,
};
const candidateInclude = (vacancyId) => ({
    candidate: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            processingStatus: true,
            cvFileName: true,
            cvProcessingError: true,
            invitations: {
                where: { vacancyId },
                orderBy: { createdAt: 'desc' },
                select: interviewInvitationSummarySelect,
                take: 1,
            },
            sessions: {
                where: { vacancyId },
                orderBy: { createdAt: 'desc' },
                select: {
                    evaluationStatus: true,
                    evaluatedAt: true,
                    invitationId: true,
                    overallScore: true,
                    status: true,
                },
                take: 1,
            },
        },
    },
});
let VacancyCandidateService = class VacancyCandidateService {
    prisma;
    vacancyService;
    candidateService;
    vacancyTechnologyService;
    constructor(prisma, vacancyService, candidateService, vacancyTechnologyService) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
        this.candidateService = candidateService;
        this.vacancyTechnologyService = vacancyTechnologyService;
    }
    async uploadCvs(user, vacancyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        const seenEmails = new Set();
        const items = [];
        for (const item of dto.candidates) {
            const email = item.email?.trim().toLowerCase();
            if (email !== undefined && seenEmails.has(email)) {
                items.push({
                    fileName: item.fileName,
                    message: 'Candidate already exists for this vacancy.',
                    status: 'DUPLICATE',
                });
                continue;
            }
            if (email !== undefined)
                seenEmails.add(email);
            items.push(await this.ingestCv(vacancyId, { ...item, email }));
        }
        return { items };
    }
    // Anonymous CV submission via a vacancy's public application link. The keyword score is
    // computed here because the request comes from an untrusted, unauthenticated browser.
    async submitPublicApplication(token, dto) {
        const vacancy = await this.vacancyService.findAcceptingPublicApplication(token);
        const technologies = await this.vacancyTechnologyService.findKeywordMatchTechnologies(vacancy.id);
        const { score, ...breakdown } = (0, keyword_cv_match_js_1.calculateKeywordMatch)(dto.extractedText, technologies);
        const result = await this.ingestCv(vacancy.id, {
            email: dto.email.trim().toLowerCase(),
            extractedText: dto.extractedText,
            fileName: dto.fileName,
            keywordMatchBreakdown: breakdown,
            keywordMatchScore: score,
        });
        if (result.status === 'DUPLICATE') {
            throw new common_1.ConflictException('You have already applied for this position.');
        }
    }
    async ingestCv(vacancyId, item) {
        const { email } = item;
        try {
            const candidate = await this.prisma.$transaction(async (transaction) => {
                if (email !== undefined) {
                    await transaction.$executeRaw `SELECT pg_advisory_xact_lock(hashtext(${`${vacancyId}:${email}`}))`;
                    const existingAssociation = await transaction.vacancyCandidate.findFirst({
                        where: { vacancyId, candidate: { is: { email } } },
                        select: { id: true },
                    });
                    if (existingAssociation !== null)
                        throw new DuplicateCandidateForVacancyError();
                }
                // No AI runs at upload: the browser already supplied the email, CV text and keyword
                // match. The name is provisional until HR calculates the AI CV match, which extracts it.
                const uploadedAt = new Date();
                const createdCandidate = await transaction.candidate.create({
                    data: {
                        name: email ?? toUploadTimestampName(uploadedAt),
                        email,
                        phone: '',
                        status: 'ACTIVE',
                        processingStatus: client_1.CandidateProcessingStatus.READY,
                        cvFileName: this.toFileName(item.fileName),
                        cvExtractedText: item.extractedText,
                    },
                });
                await transaction.vacancyCandidate.create({
                    data: {
                        candidateId: createdCandidate.id,
                        vacancyId,
                        vacancyMatchScore: 0,
                        keywordMatchScore: item.keywordMatchScore,
                        keywordMatchCalculatedAt: new Date(),
                        keywordMatchBreakdown: item.keywordMatchBreakdown,
                        requiredTechnologiesMet: [],
                        preferredTechnologiesMet: [],
                        strengths: [],
                        gaps: [],
                        decision: client_1.CandidateDecision.KEEP_IN_REVIEW,
                        summary: '',
                        notes: '',
                    },
                });
                return createdCandidate;
            });
            return { candidateId: candidate.id, fileName: item.fileName, status: 'CREATED' };
        }
        catch (error) {
            if (error instanceof DuplicateCandidateForVacancyError ||
                (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
                return {
                    fileName: item.fileName,
                    message: 'Candidate already exists for this vacancy.',
                    status: 'DUPLICATE',
                };
            }
            throw error;
        }
    }
    async retryCvProcessing(user, vacancyId, vacancyCandidateId) {
        const association = await this.findOne(user, vacancyId, vacancyCandidateId);
        if (association.candidate.processingStatus !== client_1.CandidateProcessingStatus.FAILED) {
            throw new common_1.ConflictException('Only failed CV processing can be retried.');
        }
        // CV extraction now happens in the AI CV match, so a failed legacy intake only needs to be
        // released; HR then calculates the AI match to extract the CV.
        await this.prisma.candidate.update({
            where: { id: association.candidateId },
            data: { cvProcessingError: null, processingStatus: client_1.CandidateProcessingStatus.READY },
        });
        return this.findOne(user, vacancyId, vacancyCandidateId);
    }
    async queueAiMatches(user, vacancyId, vacancyCandidateIds) {
        await this.vacancyService.findOne(user, vacancyId);
        const uniqueIds = [...new Set(vacancyCandidateIds)];
        const associations = await this.prisma.vacancyCandidate.findMany({
            where: { id: { in: uniqueIds }, vacancyId },
            select: { candidate: { select: { processingStatus: true } }, id: true },
        });
        if (associations.length !== uniqueIds.length) {
            throw new common_1.NotFoundException('One or more vacancy candidates were not found.');
        }
        if (associations.some((association) => association.candidate.processingStatus !== client_1.CandidateProcessingStatus.READY)) {
            throw new common_1.ConflictException('AI matching requires completed CV processing.');
        }
        const eligibleIds = associations.map((association) => association.id);
        // COMPLETED is re-queued for recalculation: the existing row's AI result is replaced on
        // completion. QUEUED/PROCESSING rows are left alone so a match never runs twice at once.
        await this.prisma.vacancyCandidate.updateMany({
            where: {
                id: { in: eligibleIds },
                aiMatchStatus: {
                    in: [client_1.AiMatchStatus.NOT_REQUESTED, client_1.AiMatchStatus.FAILED, client_1.AiMatchStatus.COMPLETED],
                },
            },
            data: {
                aiMatchError: null,
                aiMatchStartedAt: null,
                aiMatchCompletedAt: null,
                aiMatchStatus: client_1.AiMatchStatus.QUEUED,
            },
        });
        const queued = await this.prisma.vacancyCandidate.findMany({
            where: { id: { in: eligibleIds }, aiMatchStatus: client_1.AiMatchStatus.QUEUED },
            select: { id: true },
        });
        return queued.map((association) => association.id);
    }
    async claimAiMatch(vacancyCandidateId) {
        const claim = await this.prisma.vacancyCandidate.updateMany({
            where: { id: vacancyCandidateId, aiMatchStatus: client_1.AiMatchStatus.QUEUED },
            data: { aiMatchStartedAt: new Date(), aiMatchStatus: client_1.AiMatchStatus.PROCESSING },
        });
        return claim.count === 1;
    }
    async completeAiMatch(vacancyCandidateId, result) {
        await this.prisma.$transaction(async (transaction) => {
            // Guarded by PROCESSING so a result never lands on a match that was not claimed.
            const completed = await transaction.vacancyCandidate.updateMany({
                where: { id: vacancyCandidateId, aiMatchStatus: client_1.AiMatchStatus.PROCESSING },
                data: {
                    aiMatchCompletedAt: new Date(),
                    aiMatchError: null,
                    aiMatchScore: result.score,
                    aiMatchStatus: client_1.AiMatchStatus.COMPLETED,
                    gaps: result.gaps,
                    preferredTechnologiesMet: result.preferredTechnologiesMet,
                    requiredTechnologiesMet: result.requiredTechnologiesMet,
                    strengths: result.strengths,
                    summary: result.summary,
                    vacancyMatchScore: result.vacancyMatchScore,
                },
            });
            if (completed.count === 0)
                return;
            const association = await transaction.vacancyCandidate.findUniqueOrThrow({
                where: { id: vacancyCandidateId },
                select: { candidate: { select: { email: true, id: true } }, vacancyId: true },
            });
            const { candidate } = result.extractedData;
            await transaction.candidate.update({
                where: { id: association.candidate.id },
                data: {
                    ...(candidate.fullName === null ? {} : { name: candidate.fullName }),
                    ...(candidate.phone === null ? {} : { phone: candidate.phone.slice(0, 50) }),
                    ...(association.candidate.email === null
                        ? await this.findAvailableExtractedEmail(transaction, association.vacancyId, candidate.email)
                        : {}),
                    cvExtractedData: result.extractedData,
                },
            });
        });
    }
    // The browser-extracted email is authoritative and is never replaced. Only when the upload had
    // no email is the AI-extracted one adopted, and only if no other candidate already uses it.
    async findAvailableExtractedEmail(transaction, vacancyId, extractedEmail) {
        const email = extractedEmail?.trim().toLowerCase();
        if (email === undefined || !(0, class_validator_1.isEmail)(email) || email.length > 255)
            return {};
        await transaction.$executeRaw `SELECT pg_advisory_xact_lock(hashtext(${`${vacancyId}:${email}`}))`;
        const existing = await transaction.candidate.findFirst({
            where: { email },
            select: { id: true },
        });
        return existing === null ? { email } : {};
    }
    async failAiMatch(vacancyCandidateId) {
        await this.prisma.vacancyCandidate.updateMany({
            where: { id: vacancyCandidateId, aiMatchStatus: client_1.AiMatchStatus.PROCESSING },
            data: {
                aiMatchError: 'We could not calculate the AI match score.',
                aiMatchStatus: client_1.AiMatchStatus.FAILED,
            },
        });
    }
    async getPersistedCvExtractedData(vacancyCandidateId) {
        const vacancyCandidate = await this.prisma.vacancyCandidate.findUnique({
            where: { id: vacancyCandidateId },
            select: {
                candidate: {
                    select: { cvExtractedData: true, processingStatus: true },
                },
            },
        });
        if (vacancyCandidate === null)
            throw new common_1.NotFoundException('Vacancy candidate not found.');
        if (vacancyCandidate.candidate.cvExtractedData === null) {
            throw new common_1.ConflictException('Candidate CV processing has not completed.');
        }
        if (vacancyCandidate.candidate.processingStatus !== client_1.CandidateProcessingStatus.READY) {
            throw new common_1.ConflictException('Candidate CV processing has not completed.');
        }
        const parsed = cv_extraction_types_js_1.extractedCvDataSchema.safeParse(vacancyCandidate.candidate.cvExtractedData);
        if (!parsed.success)
            throw new common_1.BadRequestException('Candidate CV extracted data is invalid.');
        return parsed.data;
    }
    async getCvTextForAiMatch(vacancyCandidateId) {
        const vacancyCandidate = await this.prisma.vacancyCandidate.findUnique({
            where: { id: vacancyCandidateId },
            select: { candidate: { select: { cvExtractedText: true } } },
        });
        if (vacancyCandidate === null)
            throw new common_1.NotFoundException('Vacancy candidate not found.');
        const cvText = vacancyCandidate.candidate.cvExtractedText;
        if (cvText === null || cvText.trim().length === 0) {
            throw new common_1.ConflictException('The candidate has no uploaded CV text.');
        }
        return cvText;
    }
    async create(user, vacancyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        const candidate = await this.candidateService.findOrCreate(dto);
        try {
            return this.toResponse(await this.prisma.vacancyCandidate.create({
                data: {
                    candidateId: candidate.id,
                    vacancyId,
                    vacancyMatchScore: 0,
                    requiredTechnologiesMet: [],
                    preferredTechnologiesMet: [],
                    strengths: [],
                    gaps: [],
                    decision: client_1.CandidateDecision.KEEP_IN_REVIEW,
                    summary: '',
                    notes: '',
                },
                include: candidateInclude(vacancyId),
            }));
        }
        catch (error) {
            this.rethrowDuplicateAssociation(error);
        }
    }
    async findAll(user, vacancyId, query) {
        await this.vacancyService.findOne(user, vacancyId);
        this.validateScoreRange(query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const where = this.toListWhere(vacancyId, query);
        const isInterviewScoreSort = query.sortBy === vacancy_candidate_list_query_dto_js_1.VacancyCandidateSortBy.AI_INTERVIEW_SCORE;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.vacancyCandidate.findMany({
                where,
                include: candidateInclude(vacancyId),
                orderBy: isInterviewScoreSort
                    ? { createdAt: vacancy_candidate_list_query_dto_js_1.SortDirection.DESC }
                    : this.toListOrderBy(query),
                ...(isInterviewScoreSort ? {} : { skip: (page - 1) * limit, take: limit }),
            }),
            this.prisma.vacancyCandidate.count({ where }),
        ]);
        const pageItems = isInterviewScoreSort
            ? this.sortByInterviewScore(items, query.sortDirection ?? vacancy_candidate_list_query_dto_js_1.SortDirection.DESC).slice((page - 1) * limit, page * limit)
            : items;
        return {
            items: pageItems.map((item) => this.toResponse(item)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(user, vacancyId, vacancyCandidateId) {
        await this.vacancyService.findOne(user, vacancyId);
        return this.toResponse(await this.findAssociation(vacancyId, vacancyCandidateId));
    }
    async update(user, vacancyId, vacancyCandidateId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        await this.findAssociation(vacancyId, vacancyCandidateId);
        return this.toResponse(await this.prisma.vacancyCandidate.update({
            where: { id: vacancyCandidateId },
            data: dto,
            include: candidateInclude(vacancyId),
        }));
    }
    async remove(user, vacancyId, vacancyCandidateId) {
        await this.vacancyService.findOne(user, vacancyId);
        const association = await this.findAssociation(vacancyId, vacancyCandidateId);
        await this.prisma.$transaction(async (transaction) => {
            await this.deleteInterviewData(transaction, association.candidateId, vacancyId);
            await transaction.vacancyCandidate.delete({ where: { id: association.id } });
            const remainingAssociations = await transaction.vacancyCandidate.count({
                where: { candidateId: association.candidateId },
            });
            if (remainingAssociations === 0) {
                await transaction.candidate.delete({ where: { id: association.candidateId } });
            }
        });
    }
    async findAssociation(vacancyId, vacancyCandidateId) {
        const association = await this.prisma.vacancyCandidate.findFirst({
            where: { id: vacancyCandidateId, vacancyId },
            include: candidateInclude(vacancyId),
        });
        if (association === null) {
            throw new common_1.NotFoundException('Vacancy candidate not found.');
        }
        return association;
    }
    async deleteInterviewData(transaction, candidateId, vacancyId) {
        const sessions = await transaction.interviewSession.findMany({
            where: { candidateId, vacancyId },
            select: { id: true },
        });
        const sessionIds = sessions.map((session) => session.id);
        if (sessionIds.length > 0) {
            await transaction.interviewQuestionAnswer.updateMany({
                where: { interviewSessionId: { in: sessionIds }, followUpFromId: { not: null } },
                data: { followUpFromId: null },
            });
            await transaction.interviewQuestionAnswer.deleteMany({
                where: { interviewSessionId: { in: sessionIds } },
            });
            await transaction.interviewSession.deleteMany({ where: { id: { in: sessionIds } } });
        }
        await transaction.interviewInvitation.deleteMany({ where: { candidateId, vacancyId } });
    }
    toFileName(originalName) {
        const fileName = originalName.replaceAll('\\', '/').split('/').at(-1) ?? '';
        if (fileName.length === 0 ||
            fileName.length > 255 ||
            !fileName.toLowerCase().endsWith('.pdf')) {
            throw new common_1.BadRequestException('The CV filename is invalid.');
        }
        return fileName;
    }
    rethrowDuplicateAssociation(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new common_1.ConflictException('This candidate is already associated with the vacancy.');
        }
        throw error;
    }
    toListWhere(vacancyId, query) {
        return {
            vacancyId,
            ...(query.status === undefined && query.processingStatus === undefined
                ? {}
                : {
                    candidate: {
                        is: {
                            ...(query.status === undefined ? {} : { status: query.status }),
                            ...(query.processingStatus === undefined
                                ? {}
                                : { processingStatus: query.processingStatus }),
                        },
                    },
                }),
            ...(query.decision === undefined ? {} : { decision: query.decision }),
            ...(query.minMatchScore === undefined && query.maxMatchScore === undefined
                ? {}
                : {
                    vacancyMatchScore: {
                        ...(query.minMatchScore === undefined ? {} : { gte: query.minMatchScore }),
                        ...(query.maxMatchScore === undefined ? {} : { lte: query.maxMatchScore }),
                    },
                }),
        };
    }
    toListOrderBy(query) {
        const direction = query.sortDirection ?? vacancy_candidate_list_query_dto_js_1.SortDirection.DESC;
        const sortBy = query.sortBy ?? vacancy_candidate_list_query_dto_js_1.VacancyCandidateSortBy.CREATED_AT;
        if (sortBy === vacancy_candidate_list_query_dto_js_1.VacancyCandidateSortBy.AI_MATCH_SCORE) {
            return [
                { aiMatchScore: { nulls: 'last', sort: direction } },
                { createdAt: vacancy_candidate_list_query_dto_js_1.SortDirection.DESC },
            ];
        }
        if (sortBy === vacancy_candidate_list_query_dto_js_1.VacancyCandidateSortBy.KEYWORD_MATCH_SCORE) {
            return [
                { keywordMatchScore: { nulls: 'last', sort: direction } },
                { createdAt: vacancy_candidate_list_query_dto_js_1.SortDirection.DESC },
            ];
        }
        const field = sortBy === vacancy_candidate_list_query_dto_js_1.VacancyCandidateSortBy.MATCH_SCORE
            ? 'vacancyMatchScore'
            : sortBy === vacancy_candidate_list_query_dto_js_1.VacancyCandidateSortBy.UPDATED_AT
                ? 'updatedAt'
                : 'createdAt';
        return [{ [field]: direction }, { createdAt: vacancy_candidate_list_query_dto_js_1.SortDirection.DESC }];
    }
    sortByInterviewScore(candidates, direction) {
        return [...candidates].sort((first, second) => {
            const firstScore = this.getCompletedInterviewScore(first);
            const secondScore = this.getCompletedInterviewScore(second);
            if (firstScore === null && secondScore === null) {
                return second.createdAt.getTime() - first.createdAt.getTime();
            }
            if (firstScore === null)
                return 1;
            if (secondScore === null)
                return -1;
            if (firstScore === secondScore)
                return second.createdAt.getTime() - first.createdAt.getTime();
            return direction === vacancy_candidate_list_query_dto_js_1.SortDirection.ASC ? firstScore - secondScore : secondScore - firstScore;
        });
    }
    getCompletedInterviewScore(candidate) {
        const session = candidate.candidate.sessions[0];
        return session?.evaluationStatus === 'EVALUATED' && session.overallScore !== null
            ? Number(session.overallScore)
            : null;
    }
    validateScoreRange(query) {
        if (query.minMatchScore !== undefined &&
            query.maxMatchScore !== undefined &&
            query.minMatchScore > query.maxMatchScore) {
            throw new common_1.BadRequestException('minMatchScore must not exceed maxMatchScore.');
        }
    }
    toResponse(candidate) {
        return candidate;
    }
};
exports.VacancyCandidateService = VacancyCandidateService;
exports.VacancyCandidateService = VacancyCandidateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService,
        candidate_service_js_1.CandidateService,
        vacancy_technology_service_js_1.VacancyTechnologyService])
], VacancyCandidateService);
class DuplicateCandidateForVacancyError extends Error {
}
// Provisional name for a CV uploaded without an email, e.g. "2026-09-28 14:05:31 UTC". UTC keeps
// it independent of the server's time zone and matches the backfill in the migration.
function toUploadTimestampName(uploadedAt) {
    return `${uploadedAt.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}
//# sourceMappingURL=vacancy-candidate.service.js.map