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
exports.VacancyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const vacancyInclude = {
    createdByUser: { select: { name: true } },
};
// Job-posting fields safe to expose to anonymous applicants. Never add internal fields
// (notes, ids, question set, interview configuration) here.
const publicApplicationSelect = {
    deadline: true,
    employmentType: true,
    experienceMax: true,
    experienceMin: true,
    jobDescription: true,
    location: true,
    status: true,
    title: true,
    workType: true,
    organization: { select: { name: true } },
};
const closedVacancyStatuses = [client_1.VacancyStatus.CLOSED, client_1.VacancyStatus.ARCHIVED];
const DEADLINE_DAY_MS = 24 * 60 * 60 * 1000;
let VacancyService = class VacancyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(user, dto) {
        return this.prisma.vacancy.create({
            data: {
                ...dto,
                organizationId: user.organizationId,
                createdBy: user.id,
                status: client_1.VacancyStatus.DRAFT,
            },
            include: vacancyInclude,
        });
    }
    async findAll(user) {
        return this.prisma.vacancy.findMany({
            where: { organizationId: user.organizationId },
            orderBy: { createdAt: 'desc' },
            include: vacancyInclude,
        });
    }
    async findOne(user, vacancyId) {
        return this.findOwnedVacancy(vacancyId, user.organizationId);
    }
    async update(user, vacancyId, dto) {
        await this.findOwnedVacancy(vacancyId, user.organizationId);
        return this.prisma.vacancy.update({
            where: { id: vacancyId },
            data: dto,
            include: vacancyInclude,
        });
    }
    async remove(user, vacancyId) {
        await this.findOwnedVacancy(vacancyId, user.organizationId);
        await this.prisma.$transaction(async (transaction) => {
            const associations = await transaction.vacancyCandidate.findMany({
                where: { vacancyId },
                select: { candidateId: true },
            });
            const sessions = await transaction.interviewSession.findMany({
                where: { vacancyId },
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
            await transaction.interviewInvitation.deleteMany({ where: { vacancyId } });
            await transaction.vacancyQuestion.deleteMany({ where: { vacancyId } });
            await transaction.vacancyCustomQuestion.deleteMany({ where: { vacancyId } });
            await transaction.experienceCompetencyGeneration.deleteMany({ where: { vacancyId } });
            await transaction.vacancyExperienceQuestion.deleteMany({
                where: { area: { vacancyId } },
            });
            await transaction.vacancyExperienceArea.deleteMany({ where: { vacancyId } });
            await transaction.vacancyTechnology.deleteMany({ where: { vacancyId } });
            await transaction.vacancyCandidate.deleteMany({ where: { vacancyId } });
            for (const association of associations) {
                const remainingAssociations = await transaction.vacancyCandidate.count({
                    where: { candidateId: association.candidateId },
                });
                if (remainingAssociations === 0) {
                    await transaction.candidate.delete({ where: { id: association.candidateId } });
                }
            }
            await transaction.vacancy.delete({ where: { id: vacancyId } });
        });
    }
    async findPublicApplication(token) {
        const vacancy = await this.prisma.vacancy.findUnique({
            where: { publicApplicationToken: token },
            select: publicApplicationSelect,
        });
        if (vacancy === null)
            throw new common_1.NotFoundException('Application link not found.');
        const { organization, status, ...posting } = vacancy;
        return {
            ...posting,
            acceptingApplications: this.isAcceptingApplications(status, vacancy.deadline),
            companyName: organization.name,
        };
    }
    // Vacancies stay DRAFT until explicitly closed (no activation step exists), so applications
    // are accepted unless the vacancy is closed/archived or its deadline has passed.
    async findAcceptingPublicApplication(token) {
        const vacancy = await this.prisma.vacancy.findUnique({
            where: { publicApplicationToken: token },
            select: { deadline: true, id: true, status: true },
        });
        if (vacancy === null)
            throw new common_1.NotFoundException('Application link not found.');
        if (!this.isAcceptingApplications(vacancy.status, vacancy.deadline)) {
            throw new common_1.ConflictException('Applications for this position are closed.');
        }
        return { id: vacancy.id };
    }
    // Deadlines are stored as midnight UTC of the chosen date; the whole deadline day stays open.
    isAcceptingApplications(status, deadline) {
        return (!closedVacancyStatuses.includes(status) &&
            deadline.getTime() + DEADLINE_DAY_MS > Date.now());
    }
    async findOwnedVacancy(vacancyId, organizationId) {
        const vacancy = await this.prisma.vacancy.findFirst({
            where: { id: vacancyId, organizationId },
            include: vacancyInclude,
        });
        if (vacancy === null) {
            throw new common_1.NotFoundException('Vacancy not found.');
        }
        return vacancy;
    }
};
exports.VacancyService = VacancyService;
exports.VacancyService = VacancyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], VacancyService);
//# sourceMappingURL=vacancy.service.js.map