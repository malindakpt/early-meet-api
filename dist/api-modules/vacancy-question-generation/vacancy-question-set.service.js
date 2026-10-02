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
exports.VacancyQuestionSetService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const question_service_js_1 = require("../questions/question.service.js");
const vacancy_technology_service_js_1 = require("../vacancy-technologies/vacancy-technology.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const vacancyQuestionInclude = {
    question: { select: { estimatedAnswerTimeSeconds: true } },
};
let VacancyQuestionSetService = class VacancyQuestionSetService {
    prisma;
    vacancyService;
    vacancyTechnologyService;
    questionService;
    constructor(prisma, vacancyService, vacancyTechnologyService, questionService) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
        this.vacancyTechnologyService = vacancyTechnologyService;
        this.questionService = questionService;
    }
    async findAll(user, vacancyId) {
        await this.vacancyService.findOne(user, vacancyId);
        return this.prisma.vacancyQuestion
            .findMany({
            where: { vacancyId },
            include: vacancyQuestionInclude,
            orderBy: { sequence: 'asc' },
        })
            .then((questions) => questions.map((question) => this.toResponse(question)));
    }
    async add(user, vacancyId, dto) {
        const [, question] = await Promise.all([
            this.vacancyService.findOne(user, vacancyId),
            this.questionService.findOne(dto.questionId),
            this.vacancyTechnologyService.findAll(user, vacancyId),
        ]);
        if (question.status !== client_1.QuestionStatus.APPROVED) {
            throw new common_1.UnprocessableEntityException('Question must be active and match a configured vacancy technology and difficulty.');
        }
        return this.prisma
            .$transaction((transaction) => this.createSnapshot(transaction, vacancyId, question))
            .then((question) => this.toResponse(question));
    }
    async findAvailable(user, vacancyId, query) {
        await this.vacancyService.findOne(user, vacancyId);
        const result = await this.questionService.searchApproved(query);
        const addedQuestionIds = new Set((await this.prisma.vacancyQuestion.findMany({
            where: { vacancyId, questionId: { in: result.items.map((question) => question.id) } },
            select: { questionId: true },
        })).map((row) => row.questionId));
        return {
            items: result.items.map((question) => ({
                ...question,
                alreadyAdded: addedQuestionIds.has(question.id),
            })),
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 20,
            total: result.total,
        };
    }
    async findAllCustom(user, vacancyId) {
        await this.vacancyService.findOne(user, vacancyId);
        return this.prisma.vacancyCustomQuestion.findMany({
            where: { vacancyId },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async createCustom(user, vacancyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        return this.prisma.$transaction(async (transaction) => {
            const lastQuestion = await transaction.vacancyCustomQuestion.findFirst({
                where: { vacancyId },
                orderBy: { displayOrder: 'desc' },
                select: { displayOrder: true },
            });
            return transaction.vacancyCustomQuestion.create({
                data: {
                    vacancyId,
                    questionText: dto.questionText.trim(),
                    evaluationCriteria: dto.evaluationCriteria?.trim() || null,
                    displayOrder: (lastQuestion?.displayOrder ?? 0) + 1,
                },
            });
        });
    }
    async updateCustom(user, vacancyId, customQuestionId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        if (Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException('At least one custom question field is required.');
        }
        const question = await this.findCustom(vacancyId, customQuestionId);
        if (dto.displayOrder !== undefined && dto.displayOrder !== question.displayOrder) {
            await this.reorderCustom(vacancyId, customQuestionId, dto.displayOrder);
        }
        if (dto.questionText !== undefined || dto.evaluationCriteria !== undefined) {
            return this.prisma.vacancyCustomQuestion.update({
                where: { id: customQuestionId },
                data: {
                    ...(dto.questionText === undefined ? {} : { questionText: dto.questionText.trim() }),
                    ...(dto.evaluationCriteria === undefined
                        ? {}
                        : {
                            evaluationCriteria: dto.evaluationCriteria === null ? null : dto.evaluationCriteria.trim() || null,
                        }),
                },
            });
        }
        return this.prisma.vacancyCustomQuestion.findUniqueOrThrow({ where: { id: customQuestionId } });
    }
    async removeCustom(user, vacancyId, customQuestionId) {
        await this.vacancyService.findOne(user, vacancyId);
        await this.findCustom(vacancyId, customQuestionId);
        await this.prisma.$transaction(async (transaction) => {
            await transaction.vacancyCustomQuestion.delete({ where: { id: customQuestionId } });
            await this.replaceCustomOrders(transaction, await transaction.vacancyCustomQuestion.findMany({
                where: { vacancyId },
                orderBy: { displayOrder: 'asc' },
            }));
        });
    }
    async update(user, vacancyId, vacancyQuestionId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        const vacancyQuestion = await this.findOne(vacancyId, vacancyQuestionId);
        if (Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException('At least one vacancy question field is required.');
        }
        if (dto.sequence !== undefined && dto.sequence !== vacancyQuestion.sequence) {
            await this.reorder(vacancyId, vacancyQuestionId, dto.sequence);
        }
        return this.prisma.vacancyQuestion
            .findFirst({ where: { id: vacancyQuestionId, vacancyId }, include: vacancyQuestionInclude })
            .then((question) => {
            if (question === null)
                throw new common_1.NotFoundException('Vacancy question not found.');
            return this.toResponse(question);
        });
    }
    async remove(user, vacancyId, vacancyQuestionId) {
        await this.vacancyService.findOne(user, vacancyId);
        await this.findOne(vacancyId, vacancyQuestionId);
        await this.prisma.$transaction(async (transaction) => {
            await transaction.vacancyQuestion.delete({ where: { id: vacancyQuestionId } });
            const remaining = await transaction.vacancyQuestion.findMany({
                where: { vacancyId },
                orderBy: { sequence: 'asc' },
            });
            await this.replaceSequences(transaction, remaining);
        });
    }
    async findOne(vacancyId, vacancyQuestionId) {
        const vacancyQuestion = await this.prisma.vacancyQuestion.findFirst({
            where: { id: vacancyQuestionId, vacancyId },
        });
        if (vacancyQuestion === null) {
            throw new common_1.NotFoundException('Vacancy question not found.');
        }
        return vacancyQuestion;
    }
    async findCustom(vacancyId, customQuestionId) {
        const question = await this.prisma.vacancyCustomQuestion.findFirst({
            where: { id: customQuestionId, vacancyId },
        });
        if (question === null)
            throw new common_1.NotFoundException('Custom vacancy question not found.');
        return question;
    }
    async createSnapshot(transaction, vacancyId, question) {
        try {
            const lastQuestion = await transaction.vacancyQuestion.findFirst({
                where: { vacancyId },
                orderBy: { sequence: 'desc' },
                select: { sequence: true },
            });
            return await transaction.vacancyQuestion.create({
                data: {
                    vacancyId,
                    questionId: question.id,
                    sequence: (lastQuestion?.sequence ?? 0) + 1,
                    questionText: question.questionText,
                    difficulty: question.difficulty,
                    questionType: question.questionType,
                    followUpAllowed: question.followUpAllowed,
                    evaluationCriteria: this.toInputJsonValue(question.evaluationCriteria),
                },
                include: vacancyQuestionInclude,
            });
        }
        catch (error) {
            if (typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('This question is already selected for the vacancy.');
            }
            throw error;
        }
    }
    async reorder(vacancyId, vacancyQuestionId, sequence) {
        await this.prisma.$transaction(async (transaction) => {
            const questions = await transaction.vacancyQuestion.findMany({
                where: { vacancyId },
                orderBy: { sequence: 'asc' },
            });
            const moved = questions.find((question) => question.id === vacancyQuestionId);
            if (moved === undefined) {
                throw new common_1.NotFoundException('Vacancy question not found.');
            }
            if (sequence > questions.length) {
                throw new common_1.BadRequestException('sequence must be within the vacancy question set.');
            }
            const reordered = questions.filter((question) => question.id !== vacancyQuestionId);
            reordered.splice(sequence - 1, 0, moved);
            await this.replaceSequences(transaction, reordered);
        });
    }
    async reorderCustom(vacancyId, customQuestionId, displayOrder) {
        await this.prisma.$transaction(async (transaction) => {
            const questions = await transaction.vacancyCustomQuestion.findMany({
                where: { vacancyId },
                orderBy: { displayOrder: 'asc' },
            });
            if (displayOrder > questions.length) {
                throw new common_1.BadRequestException('displayOrder must be within the custom question set.');
            }
            const moved = questions.find((question) => question.id === customQuestionId);
            if (moved === undefined)
                throw new common_1.NotFoundException('Custom vacancy question not found.');
            const reordered = questions.filter((question) => question.id !== customQuestionId);
            reordered.splice(displayOrder - 1, 0, moved);
            await this.replaceCustomOrders(transaction, reordered);
        });
    }
    async replaceSequences(transaction, questions) {
        for (const [index, question] of questions.entries()) {
            await transaction.vacancyQuestion.update({
                where: { id: question.id },
                data: { sequence: -(index + 1) },
            });
        }
        for (const [index, question] of questions.entries()) {
            await transaction.vacancyQuestion.update({
                where: { id: question.id },
                data: { sequence: index + 1 },
            });
        }
    }
    async replaceCustomOrders(transaction, questions) {
        for (const [index, question] of questions.entries()) {
            await transaction.vacancyCustomQuestion.update({
                where: { id: question.id },
                data: { displayOrder: -(index + 1) },
            });
        }
        for (const [index, question] of questions.entries()) {
            await transaction.vacancyCustomQuestion.update({
                where: { id: question.id },
                data: { displayOrder: index + 1 },
            });
        }
    }
    toInputJsonValue(value) {
        return value === null ? client_1.Prisma.JsonNull : structuredClone(value);
    }
    toResponse(question) {
        const { question: sourceQuestion, ...snapshot } = question;
        return { ...snapshot, estimatedAnswerTimeSeconds: sourceQuestion.estimatedAnswerTimeSeconds };
    }
};
exports.VacancyQuestionSetService = VacancyQuestionSetService;
exports.VacancyQuestionSetService = VacancyQuestionSetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService,
        vacancy_technology_service_js_1.VacancyTechnologyService,
        question_service_js_1.QuestionService])
], VacancyQuestionSetService);
//# sourceMappingURL=vacancy-question-set.service.js.map