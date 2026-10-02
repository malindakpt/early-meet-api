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
exports.TechnologyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_js_1 = require("../../infrastructure/prisma/prisma.service.js");
let TechnologyService = class TechnologyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        try {
            return await this.prisma.technology.create({ data: dto });
        }
        catch (error) {
            this.rethrowDuplicateName(error);
        }
    }
    async findAll() {
        return this.prisma.technology.findMany({ orderBy: { name: 'asc' } });
    }
    async findOne(technologyId) {
        const technology = await this.prisma.technology.findUnique({ where: { id: technologyId } });
        if (technology === null) {
            throw new common_1.NotFoundException('Technology not found.');
        }
        return technology;
    }
    async update(technologyId, dto) {
        await this.findOne(technologyId);
        try {
            return await this.prisma.technology.update({ where: { id: technologyId }, data: dto });
        }
        catch (error) {
            this.rethrowDuplicateName(error);
        }
    }
    rethrowDuplicateName(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new common_1.ConflictException('A technology with this name already exists.');
        }
        throw error;
    }
};
exports.TechnologyService = TechnologyService;
exports.TechnologyService = TechnologyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], TechnologyService);
//# sourceMappingURL=technology.service.js.map