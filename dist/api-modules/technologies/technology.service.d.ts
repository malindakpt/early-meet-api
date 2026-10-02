import { type Technology } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import type { CreateTechnologyDto } from './dto/create-technology.dto.js';
import type { UpdateTechnologyDto } from './dto/update-technology.dto.js';
export declare class TechnologyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTechnologyDto): Promise<Technology>;
    findAll(): Promise<Technology[]>;
    findOne(technologyId: string): Promise<Technology>;
    update(technologyId: string, dto: UpdateTechnologyDto): Promise<Technology>;
    private rethrowDuplicateName;
}
