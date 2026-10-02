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
exports.TechnologySegmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
const technology_service_js_1 = require("../technologies/technology.service.js");
let TechnologySegmentService = class TechnologySegmentService {
    prisma;
    technologyService;
    constructor(prisma, technologyService) {
        this.prisma = prisma;
        this.technologyService = technologyService;
    }
    async create(technologyId, dto) {
        await this.technologyService.findOne(technologyId);
        try {
            return await this.prisma.technologySegment.create({ data: { ...dto, technologyId } });
        }
        catch (error) {
            this.rethrowDuplicateName(error);
        }
    }
    async findAll(technologyId) {
        await this.technologyService.findOne(technologyId);
        return this.prisma.technologySegment.findMany({
            where: { technologyId },
            orderBy: { name: 'asc' },
        });
    }
    async findAllAcrossTechnologies() {
        return this.prisma.technologySegment.findMany({ orderBy: { name: 'asc' } });
    }
    async findOne(technologyId, segmentId) {
        await this.technologyService.findOne(technologyId);
        return this.findSegmentForTechnology(technologyId, segmentId);
    }
    async update(technologyId, segmentId, dto) {
        await this.technologyService.findOne(technologyId);
        await this.findSegmentForTechnology(technologyId, segmentId);
        try {
            return await this.prisma.technologySegment.update({ where: { id: segmentId }, data: dto });
        }
        catch (error) {
            this.rethrowDuplicateName(error);
        }
    }
    async findSegmentForTechnology(technologyId, segmentId) {
        const segment = await this.prisma.technologySegment.findFirst({
            where: { id: segmentId, technologyId },
        });
        if (segment === null) {
            throw new common_1.NotFoundException('Technology segment not found.');
        }
        return segment;
    }
    rethrowDuplicateName(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new common_1.ConflictException('A segment with this name already exists for this technology.');
        }
        throw error;
    }
};
exports.TechnologySegmentService = TechnologySegmentService;
exports.TechnologySegmentService = TechnologySegmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        technology_service_js_1.TechnologyService])
], TechnologySegmentService);
//# sourceMappingURL=technology-segment.service.js.map