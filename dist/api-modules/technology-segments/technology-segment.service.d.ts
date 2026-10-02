import { type TechnologySegment } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { TechnologyService } from '../technologies/technology.service.js';
import type { CreateTechnologySegmentDto } from './dto/create-technology-segment.dto.js';
import type { UpdateTechnologySegmentDto } from './dto/update-technology-segment.dto.js';
export declare class TechnologySegmentService {
    private readonly prisma;
    private readonly technologyService;
    constructor(prisma: PrismaService, technologyService: TechnologyService);
    create(technologyId: string, dto: CreateTechnologySegmentDto): Promise<TechnologySegment>;
    findAll(technologyId: string): Promise<TechnologySegment[]>;
    findAllAcrossTechnologies(): Promise<TechnologySegment[]>;
    findOne(technologyId: string, segmentId: string): Promise<TechnologySegment>;
    update(technologyId: string, segmentId: string, dto: UpdateTechnologySegmentDto): Promise<TechnologySegment>;
    private findSegmentForTechnology;
    private rethrowDuplicateName;
}
