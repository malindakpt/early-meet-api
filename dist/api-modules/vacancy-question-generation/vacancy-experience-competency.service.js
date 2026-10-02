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
exports.VacancyExperienceCompetencyService = void 0;
const common_1 = require("@nestjs/common");
const configuration_values_js_1 = require("../../infrastructure/config/configuration-values.js");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const areaInclude = { questions: { orderBy: { sequence: 'asc' } } };
const experienceQuestionTemplates = [
    'How many years of professional experience do you have working with {area}?',
    'What have you personally worked on using {area}?',
    'What responsibilities did you personally have when working with {area}?',
    'What role did you play in the team when working with {area}?',
    'Tell us about some significant problems or challenges you handled while working with {area}.',
];
let VacancyExperienceCompetencyService = class VacancyExperienceCompetencyService {
    prisma;
    vacancyService;
    constructor(prisma, vacancyService) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
    }
    async findAll(user, vacancyId) {
        await this.vacancyService.findOne(user, vacancyId);
        return this.prisma.vacancyExperienceArea.findMany({
            where: { vacancyId },
            include: areaInclude,
            orderBy: { sequence: 'asc' },
        });
    }
    async createPlan(user, vacancyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        return this.prisma.$transaction(async (transaction) => {
            const lastArea = await transaction.vacancyExperienceArea.findFirst({
                where: { vacancyId },
                orderBy: { sequence: 'desc' },
                select: { sequence: true },
            });
            const areas = await Promise.all(dto.areas.map((area, index) => this.createAreaRecord(transaction, vacancyId, area, (lastArea?.sequence ?? 0) + index + 1)));
            await this.synchronizeExperienceAreaNames(transaction, vacancyId);
            return areas;
        });
    }
    async createGeneratedPlan(vacancyId, areas) {
        await this.prisma.$transaction(async (transaction) => {
            const vacancy = await transaction.vacancy.findUnique({
                where: { id: vacancyId },
                select: { id: true },
            });
            if (vacancy === null)
                throw new common_1.ConflictException('The vacancy is unavailable.');
            const lastArea = await transaction.vacancyExperienceArea.findFirst({
                where: { vacancyId },
                orderBy: { sequence: 'desc' },
                select: { sequence: true },
            });
            await Promise.all(areas.map((area, index) => this.createAreaRecord(transaction, vacancyId, area, (lastArea?.sequence ?? 0) + index + 1)));
            await this.synchronizeExperienceAreaNames(transaction, vacancyId);
        });
    }
    async replaceGeneratedAreas(vacancyId, areas) {
        await this.prisma.$transaction(async (transaction) => {
            const vacancy = await transaction.vacancy.findUnique({
                where: { id: vacancyId },
                select: { id: true },
            });
            if (vacancy === null)
                throw new common_1.ConflictException('The vacancy is unavailable.');
            await transaction.vacancyExperienceQuestion.deleteMany({ where: { area: { vacancyId } } });
            await transaction.vacancyExperienceArea.deleteMany({ where: { vacancyId } });
            await Promise.all(areas.map((area, index) => this.createAreaRecord(transaction, vacancyId, {
                ...area,
                reason: `Assess the candidate's practical experience with ${area.name}.`,
                whatToEstablish: [
                    'Professional experience duration',
                    'Personal contributions and responsibilities',
                    'Team role and challenges handled',
                ],
                questions: this.createStandardQuestions(area.name),
            }, index + 1)));
            await this.synchronizeExperienceAreaNames(transaction, vacancyId);
        });
    }
    async saveConfiguration(user, vacancyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        if (dto.areas.some((area) => area.name.trim().length === 0 ||
            area.questions.some((question) => question.questionText.trim().length === 0))) {
            throw new common_1.BadRequestException('Experience area names and questions cannot be empty.');
        }
        return this.prisma.$transaction(async (transaction) => {
            await transaction.vacancyExperienceQuestion.deleteMany({ where: { area: { vacancyId } } });
            await transaction.vacancyExperienceArea.deleteMany({ where: { vacancyId } });
            const areas = await Promise.all(dto.areas.map((area, index) => this.createAreaRecord(transaction, vacancyId, {
                importance: area.importance ?? 'MEDIUM',
                name: area.name.trim(),
                reason: `Assess the candidate's practical experience with ${area.name.trim()}.`,
                whatToEstablish: [
                    'Professional experience duration',
                    'Personal contributions and responsibilities',
                    'Team role and challenges handled',
                ],
                questions: area.questions.map((question) => ({
                    questionText: question.questionText.trim(),
                })),
            }, index + 1)));
            await this.synchronizeExperienceAreaNames(transaction, vacancyId);
            return areas;
        });
    }
    async updateArea(user, vacancyId, areaId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        if (Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException('At least one assessment area field is required.');
        }
        await this.findArea(vacancyId, areaId);
        return this.prisma.$transaction(async (transaction) => {
            const area = await transaction.vacancyExperienceArea.update({
                where: { id: areaId },
                data: {
                    ...dto,
                    ...(dto.whatToEstablish === undefined
                        ? {}
                        : { whatToEstablish: this.toInputJsonValue(dto.whatToEstablish) }),
                },
                include: areaInclude,
            });
            await this.synchronizeExperienceAreaNames(transaction, vacancyId);
            return area;
        });
    }
    async removeArea(user, vacancyId, areaId) {
        await this.vacancyService.findOne(user, vacancyId);
        await this.findArea(vacancyId, areaId);
        await this.prisma.$transaction(async (transaction) => {
            await transaction.vacancyExperienceArea.delete({ where: { id: areaId } });
            await this.replaceAreaSequences(transaction, await transaction.vacancyExperienceArea.findMany({
                where: { vacancyId },
                orderBy: { sequence: 'asc' },
            }));
            await this.synchronizeExperienceAreaNames(transaction, vacancyId);
        });
    }
    async updateQuestion(user, vacancyId, questionId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        if (Object.keys(dto).length === 0)
            throw new common_1.BadRequestException('At least one question field is required.');
        const question = await this.findQuestion(vacancyId, questionId);
        if (dto.sequence !== undefined && dto.sequence !== question.sequence) {
            await this.reorderQuestions(question.areaId, questionId, dto.sequence);
        }
        if (dto.questionText !== undefined) {
            return this.prisma.vacancyExperienceQuestion.update({
                where: { id: questionId },
                data: { questionText: dto.questionText },
            });
        }
        return this.prisma.vacancyExperienceQuestion.findUniqueOrThrow({ where: { id: questionId } });
    }
    async removeQuestion(user, vacancyId, questionId) {
        await this.vacancyService.findOne(user, vacancyId);
        const question = await this.findQuestion(vacancyId, questionId);
        await this.prisma.$transaction(async (transaction) => {
            await transaction.vacancyExperienceQuestion.delete({ where: { id: questionId } });
            await this.replaceQuestionSequences(transaction, await transaction.vacancyExperienceQuestion.findMany({
                where: { areaId: question.areaId },
                orderBy: { sequence: 'asc' },
            }));
        });
    }
    async createAreaRecord(transaction, vacancyId, dto, sequence) {
        return transaction.vacancyExperienceArea.create({
            data: {
                vacancyId,
                name: dto.name,
                importance: dto.importance,
                reason: dto.reason,
                whatToEstablish: this.toInputJsonValue(dto.whatToEstablish),
                sequence,
                questions: {
                    create: dto.questions.map((question, index) => ({
                        questionText: question.questionText,
                        sequence: index + 1,
                    })),
                },
            },
            include: areaInclude,
        });
    }
    createStandardQuestions(area) {
        const questionCount = configuration_values_js_1.configurationValues.assessmentAreaGeneration.questionsPerArea;
        if (questionCount > experienceQuestionTemplates.length) {
            throw new Error('Not enough standard experience question templates are configured.');
        }
        return experienceQuestionTemplates.slice(0, questionCount).map((template) => ({
            questionText: template.replace('{area}', area),
        }));
    }
    async synchronizeExperienceAreaNames(transaction, vacancyId) {
        const areas = await transaction.vacancyExperienceArea.findMany({
            where: { vacancyId },
            orderBy: { sequence: 'asc' },
            select: { name: true },
        });
        await transaction.vacancy.update({
            where: { id: vacancyId },
            data: { experienceAreas: areas.map((area) => area.name) },
        });
    }
    async findArea(vacancyId, areaId) {
        const area = await this.prisma.vacancyExperienceArea.findFirst({
            where: { id: areaId, vacancyId },
        });
        if (area === null)
            throw new common_1.NotFoundException('Experience and competency area not found.');
        return area;
    }
    async findQuestion(vacancyId, questionId) {
        const question = await this.prisma.vacancyExperienceQuestion.findFirst({
            where: { id: questionId, area: { vacancyId } },
        });
        if (question === null)
            throw new common_1.NotFoundException('Experience and competency question not found.');
        return question;
    }
    async reorderQuestions(areaId, questionId, sequence) {
        await this.prisma.$transaction(async (transaction) => {
            const questions = await transaction.vacancyExperienceQuestion.findMany({
                where: { areaId },
                orderBy: { sequence: 'asc' },
            });
            if (sequence > questions.length)
                throw new common_1.BadRequestException('sequence must be within the area.');
            const moved = questions.find((question) => question.id === questionId);
            if (moved === undefined)
                throw new common_1.NotFoundException('Experience and competency question not found.');
            const reordered = questions.filter((question) => question.id !== questionId);
            reordered.splice(sequence - 1, 0, moved);
            await this.replaceQuestionSequences(transaction, reordered);
        });
    }
    async replaceAreaSequences(transaction, areas) {
        for (const [index, area] of areas.entries()) {
            await transaction.vacancyExperienceArea.update({
                where: { id: area.id },
                data: { sequence: -(index + 1) },
            });
        }
        for (const [index, area] of areas.entries()) {
            await transaction.vacancyExperienceArea.update({
                where: { id: area.id },
                data: { sequence: index + 1 },
            });
        }
    }
    async replaceQuestionSequences(transaction, questions) {
        for (const [index, question] of questions.entries()) {
            await transaction.vacancyExperienceQuestion.update({
                where: { id: question.id },
                data: { sequence: -(index + 1) },
            });
        }
        for (const [index, question] of questions.entries()) {
            await transaction.vacancyExperienceQuestion.update({
                where: { id: question.id },
                data: { sequence: index + 1 },
            });
        }
    }
    toInputJsonValue(value) {
        return structuredClone(value);
    }
};
exports.VacancyExperienceCompetencyService = VacancyExperienceCompetencyService;
exports.VacancyExperienceCompetencyService = VacancyExperienceCompetencyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService])
], VacancyExperienceCompetencyService);
//# sourceMappingURL=vacancy-experience-competency.service.js.map