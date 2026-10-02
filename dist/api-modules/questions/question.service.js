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
exports.QuestionService = void 0;
const common_1 = require("@nestjs/common");
const sync_1 = require("csv-parse/sync");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const technology_segment_service_js_1 = require("../technology-segments/technology-segment.service.js");
const technology_service_js_1 = require("../technologies/technology.service.js");
const DEFAULT_QUESTION_TYPE = 'GENERAL';
const MAX_CSV_IMPORT_ROWS = 50;
const CSV_HEADERS = [
    'question',
    'technology',
    'technologySegment',
    'difficulty',
    'estimatedAnswerTimeSeconds',
    'evaluationCriteria',
    'allowFollowUp',
];
let QuestionService = class QuestionService {
    prisma;
    technologyService;
    technologySegmentService;
    constructor(prisma, technologyService, technologySegmentService) {
        this.prisma = prisma;
        this.technologyService = technologyService;
        this.technologySegmentService = technologySegmentService;
    }
    async create(user, dto) {
        await this.assertValidTechnologySegment(dto.technologyId, dto.technologySegmentId);
        const data = {
            ...dto,
            createdByUserId: user.id,
            questionType: dto.questionType ?? DEFAULT_QUESTION_TYPE,
            status: client_1.QuestionStatus.APPROVED,
        };
        return this.prisma.question.create({ data });
    }
    async findAll(user, query) {
        return this.prisma.question.findMany({
            where: {
                ...this.toQuestionWhere(query),
                ...(user.role === 'PLATFORM_ADMIN' ? {} : { status: client_1.QuestionStatus.APPROVED }),
                ...(query.search === undefined
                    ? {}
                    : { questionText: { contains: query.search, mode: 'insensitive' } }),
            },
            include: { createdByUser: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async previewCsvImport(csv) {
        const assessment = await this.assessCsvImport(csv);
        return {
            errors: assessment.errors,
            rows: assessment.rows,
            totalRows: assessment.totalRows,
            validRows: assessment.rows.length,
        };
    }
    async importCsv(user, csv) {
        const assessment = await this.assessCsvImport(csv);
        if (assessment.errors.length > 0) {
            throw new common_1.UnprocessableEntityException('The CSV contains invalid question rows.');
        }
        const result = await this.prisma.$transaction((transaction) => transaction.question.createMany({
            data: assessment.rows.map((row) => ({
                difficulty: row.difficulty,
                estimatedAnswerTimeSeconds: row.estimatedAnswerTimeSeconds,
                evaluationCriteria: row.evaluationCriteria,
                followUpAllowed: row.allowFollowUp,
                metaData: {},
                questionText: row.question,
                questionType: DEFAULT_QUESTION_TYPE,
                createdByUserId: user.id,
                status: client_1.QuestionStatus.APPROVED,
                technologyId: row.technologyId,
                technologySegmentId: row.technologySegmentId,
            })),
        }));
        return { importedCount: result.count };
    }
    async findOne(questionId) {
        const question = await this.prisma.question.findUnique({ where: { id: questionId } });
        if (question === null) {
            throw new common_1.NotFoundException('Question not found.');
        }
        return question;
    }
    async findEligibleForVacancyGeneration(technologyIds, difficulty) {
        return this.prisma.question.findMany({
            where: {
                technologyId: { in: technologyIds },
                difficulty,
                status: client_1.QuestionStatus.APPROVED,
            },
            orderBy: [{ technologyId: 'asc' }, { technologySegmentId: 'asc' }, { id: 'asc' }],
        });
    }
    async update(questionId, dto) {
        const question = await this.findOne(questionId);
        const technologyId = dto.technologyId ?? question.technologyId;
        const technologySegmentId = dto.technologySegmentId ?? question.technologySegmentId;
        await this.assertValidTechnologySegment(technologyId, technologySegmentId);
        const data = { ...dto };
        return this.prisma.question.update({ where: { id: questionId }, data });
    }
    async approve(questionId) {
        const question = await this.findOne(questionId);
        if (question.status !== client_1.QuestionStatus.PENDING) {
            throw new common_1.ConflictException('Only pending questions can be approved.');
        }
        return this.transitionStatus(questionId, client_1.QuestionStatus.APPROVED);
    }
    async archive(questionId) {
        const question = await this.findOne(questionId);
        if (question.status === client_1.QuestionStatus.ARCHIVED) {
            throw new common_1.ConflictException('This question is already archived.');
        }
        return this.transitionStatus(questionId, client_1.QuestionStatus.ARCHIVED);
    }
    async createPending(user, dto, transaction) {
        await this.assertValidTechnologySegment(dto.technologyId, dto.technologySegmentId);
        return transaction.question.create({
            data: {
                ...dto,
                createdByUserId: user.id,
                metaData: {},
                questionType: DEFAULT_QUESTION_TYPE,
                status: client_1.QuestionStatus.PENDING,
            },
        });
    }
    async searchApproved(query) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const where = {
            ...this.toQuestionWhere(query),
            status: client_1.QuestionStatus.APPROVED,
            ...(query.search === undefined
                ? {}
                : { questionText: { contains: query.search, mode: 'insensitive' } }),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.question.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.question.count({ where }),
        ]);
        return { items, total };
    }
    async assertValidTechnologySegment(technologyId, technologySegmentId) {
        await this.technologyService.findOne(technologyId);
        await this.technologySegmentService.findOne(technologyId, technologySegmentId);
    }
    toQuestionWhere(query) {
        return {
            technologyId: query.technologyIds === undefined || query.technologyIds.length === 0
                ? query.technologyId
                : { in: query.technologyIds },
            technologySegmentId: query.technologySegmentId,
            difficulty: query.difficulty,
            questionType: query.questionType,
            status: query.status,
        };
    }
    async transitionStatus(questionId, status) {
        return this.prisma.question.update({ where: { id: questionId }, data: { status } });
    }
    async assessCsvImport(csv) {
        const records = this.parseCsv(csv);
        const errors = [];
        if (records.length > MAX_CSV_IMPORT_ROWS) {
            return {
                errors: [{ message: 'Bulk import is limited to 50 questions per CSV.', row: 1 }],
                rows: [],
                totalRows: records.length,
            };
        }
        const [technologies, segments] = await Promise.all([
            this.technologyService.findAll(),
            this.technologySegmentService.findAllAcrossTechnologies(),
        ]);
        const technologyByName = new Map(technologies.map((technology) => [technology.name.trim(), technology]));
        const segmentByTechnologyAndName = new Map(segments.map((segment) => [`${segment.technologyId}\u0000${segment.name.trim()}`, segment]));
        const questions = new Set();
        const rows = [];
        for (const [recordIndex, record] of records.entries()) {
            const row = recordIndex + 2;
            const values = Object.fromEntries(CSV_HEADERS.map((header, index) => [header, record[index]?.trim() ?? '']));
            const question = values.question;
            const technology = technologyByName.get(values.technology);
            const questionErrors = this.validateCsvRow(values, row, questions);
            if (technology === undefined && values.technology.length > 0) {
                questionErrors.push({
                    field: 'technology',
                    message: `Technology "${values.technology}" was not found.`,
                    row,
                });
            }
            const segment = technology === undefined
                ? undefined
                : segmentByTechnologyAndName.get(`${technology.id}\u0000${values.technologySegment}`);
            if (technology !== undefined &&
                segment === undefined &&
                values.technologySegment.length > 0) {
                questionErrors.push({
                    field: 'technologySegment',
                    message: `Technology Segment "${values.technologySegment}" does not belong to Technology "${values.technology}".`,
                    row,
                });
            }
            if (questionErrors.length > 0 || technology === undefined || segment === undefined) {
                errors.push(...questionErrors);
                continue;
            }
            rows.push({
                allowFollowUp: values.allowFollowUp.toLowerCase() === 'true',
                difficulty: values.difficulty,
                estimatedAnswerTimeSeconds: Number(values.estimatedAnswerTimeSeconds),
                evaluationCriteria: JSON.parse(values.evaluationCriteria),
                question,
                row,
                technology: technology.name,
                technologyId: technology.id,
                technologySegment: segment.name,
                technologySegmentId: segment.id,
            });
        }
        return { errors, rows, totalRows: records.length };
    }
    parseCsv(csv) {
        let records;
        try {
            records = (0, sync_1.parse)(csv, {
                bom: true,
                relax_column_count: false,
                skip_empty_lines: true,
                trim: true,
            });
        }
        catch (error) {
            throw new common_1.UnprocessableEntityException('The CSV file is malformed.', { cause: error });
        }
        if (records.length === 0)
            throw new common_1.UnprocessableEntityException('The CSV file is empty.');
        const headers = records[0];
        if (headers === undefined)
            throw new common_1.UnprocessableEntityException('The CSV file is empty.');
        const uniqueHeaders = new Set(headers);
        for (const header of headers) {
            if (!CSV_HEADERS.includes(header)) {
                throw new common_1.UnprocessableEntityException(`Unexpected column: ${header}`);
            }
        }
        if (headers.length !== CSV_HEADERS.length || uniqueHeaders.size !== headers.length) {
            throw new common_1.UnprocessableEntityException('CSV headers must match the required format.');
        }
        if (CSV_HEADERS.some((header, index) => headers[index] !== header)) {
            throw new common_1.UnprocessableEntityException(`CSV headers must be: ${CSV_HEADERS.join(',')}`);
        }
        if (records.length === 1)
            throw new common_1.UnprocessableEntityException('The CSV file has no question rows.');
        return records.slice(1);
    }
    validateCsvRow(values, row, questions) {
        const errors = [];
        const requiredFields = [
            'question',
            'technology',
            'technologySegment',
            'difficulty',
            'estimatedAnswerTimeSeconds',
            'evaluationCriteria',
            'allowFollowUp',
        ];
        for (const field of requiredFields) {
            if (values[field].length === 0)
                errors.push({ field, message: 'This field is required.', row });
        }
        if (values.question.length > 0) {
            if (questions.has(values.question))
                errors.push({ field: 'question', message: 'Duplicate question found within CSV.', row });
            questions.add(values.question);
        }
        if (!Object.values(client_1.Difficulty).includes(values.difficulty)) {
            errors.push({
                field: 'difficulty',
                message: `Invalid difficulty "${values.difficulty}".`,
                row,
            });
        }
        const estimatedAnswerTimeSeconds = Number(values.estimatedAnswerTimeSeconds);
        if (!Number.isInteger(estimatedAnswerTimeSeconds) ||
            estimatedAnswerTimeSeconds < 30 ||
            estimatedAnswerTimeSeconds > 900) {
            errors.push({
                field: 'estimatedAnswerTimeSeconds',
                message: 'Estimated answer time must be a whole number of seconds between 30 and 900.',
                row,
            });
        }
        if (!['true', 'false'].includes(values.allowFollowUp.toLowerCase())) {
            errors.push({ field: 'allowFollowUp', message: 'allowFollowUp must be true or false.', row });
        }
        try {
            const value = JSON.parse(values.evaluationCriteria);
            if (typeof value !== 'object' || value === null || Array.isArray(value))
                throw new Error();
        }
        catch {
            errors.push({
                field: 'evaluationCriteria',
                message: 'Evaluation criteria must be a JSON object.',
                row,
            });
        }
        return errors;
    }
};
exports.QuestionService = QuestionService;
exports.QuestionService = QuestionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        technology_service_js_1.TechnologyService,
        technology_segment_service_js_1.TechnologySegmentService])
], QuestionService);
//# sourceMappingURL=question.service.js.map