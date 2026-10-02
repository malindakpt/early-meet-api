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
exports.VacancyTechnologyService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const technology_service_js_1 = require("../technologies/technology.service.js");
const technology_segment_service_js_1 = require("../technology-segments/technology-segment.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const technologySelect = {
    id: true,
    name: true,
    description: true,
    status: true,
};
let VacancyTechnologyService = class VacancyTechnologyService {
    prisma;
    vacancyService;
    technologyService;
    technologySegmentService;
    constructor(prisma, vacancyService, technologyService, technologySegmentService) {
        this.prisma = prisma;
        this.vacancyService = vacancyService;
        this.technologyService = technologyService;
        this.technologySegmentService = technologySegmentService;
    }
    async create(user, vacancyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        await this.technologyService.findOne(dto.technologyId);
        const segmentSelections = await this.normalizeSegmentSelections(dto.technologyId, dto.segmentSelections);
        try {
            const relationship = await this.prisma.vacancyTechnology.create({
                data: { ...dto, segmentSelections, vacancyId },
                include: { technology: { select: technologySelect } },
            });
            return this.toResponse(relationship);
        }
        catch (error) {
            this.rethrowDuplicateTechnology(error);
        }
    }
    async findAll(user, vacancyId) {
        await this.vacancyService.findOne(user, vacancyId);
        const relationships = await this.prisma.vacancyTechnology.findMany({
            where: { vacancyId },
            include: { technology: { select: technologySelect } },
            orderBy: { createdAt: 'asc' },
        });
        return Promise.all(relationships.map((relationship) => this.toResponse(relationship)));
    }
    async update(user, vacancyId, vacancyTechnologyId, dto) {
        await this.vacancyService.findOne(user, vacancyId);
        const relationship = await this.findRelationship(vacancyId, vacancyTechnologyId);
        const segmentSelections = dto.segmentSelections === undefined
            ? undefined
            : await this.normalizeSegmentSelections(relationship.technologyId, dto.segmentSelections);
        const updated = await this.prisma.vacancyTechnology.update({
            where: { id: vacancyTechnologyId },
            data: { ...dto, segmentSelections },
            include: { technology: { select: technologySelect } },
        });
        return this.toResponse(updated);
    }
    async remove(user, vacancyId, vacancyTechnologyId) {
        await this.vacancyService.findOne(user, vacancyId);
        await this.findRelationship(vacancyId, vacancyTechnologyId);
        await this.prisma.vacancyTechnology.delete({ where: { id: vacancyTechnologyId } });
    }
    // Internal read for server-side keyword matching; callers must have authorized access to the
    // vacancy (e.g. via its public application token) before calling this.
    async findKeywordMatchTechnologies(vacancyId) {
        const relationships = await this.prisma.vacancyTechnology.findMany({
            where: { vacancyId },
            include: { technology: { select: technologySelect } },
            orderBy: { createdAt: 'asc' },
        });
        return Promise.all(relationships.map(async (relationship) => ({
            requirementType: relationship.requirementType,
            segments: (await this.resolveSegments(relationship.technologyId, relationship.segmentSelections)).map(({ name }) => ({ name })),
            technology: { name: relationship.technology.name },
        })));
    }
    async resolveSegments(technologyId, segmentSelections) {
        if (segmentSelections.includes('ALL')) {
            return this.technologySegmentService.findAll(technologyId);
        }
        return Promise.all(segmentSelections.map((segmentId) => this.technologySegmentService.findOne(technologyId, segmentId)));
    }
    async findRelationship(vacancyId, vacancyTechnologyId) {
        const relationship = await this.prisma.vacancyTechnology.findFirst({
            where: { id: vacancyTechnologyId, vacancyId },
            select: { technologyId: true },
        });
        if (relationship === null)
            throw new common_1.NotFoundException('Vacancy technology not found.');
        return relationship;
    }
    async normalizeSegmentSelections(technologyId, segmentSelections) {
        const normalizedSelections = [...new Set(segmentSelections)];
        if (normalizedSelections.includes('ALL')) {
            if (normalizedSelections.length > 1) {
                throw new common_1.UnprocessableEntityException('All segment selection cannot be combined with individual technology segments.');
            }
            return ['ALL'];
        }
        if (normalizedSelections.some((segmentId) => !(0, class_validator_1.isUUID)(segmentId))) {
            throw new common_1.UnprocessableEntityException('Technology segment selections must be UUIDs or ALL.');
        }
        await Promise.all(normalizedSelections.map((segmentId) => this.technologySegmentService.findOne(technologyId, segmentId)));
        return normalizedSelections;
    }
    async toResponse(relationship) {
        return {
            ...relationship,
            segments: await this.resolveSegments(relationship.technologyId, relationship.segmentSelections),
        };
    }
    rethrowDuplicateTechnology(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new common_1.ConflictException('This technology is already configured for the vacancy and requirement type.');
        }
        throw error;
    }
};
exports.VacancyTechnologyService = VacancyTechnologyService;
exports.VacancyTechnologyService = VacancyTechnologyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        vacancy_service_js_1.VacancyService,
        technology_service_js_1.TechnologyService,
        technology_segment_service_js_1.TechnologySegmentService])
], VacancyTechnologyService);
//# sourceMappingURL=vacancy-technology.service.js.map