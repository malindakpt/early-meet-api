import type { TechnologySegment } from '@prisma/client';
import { CreateTechnologySegmentDto } from './dto/create-technology-segment.dto.js';
import { UpdateTechnologySegmentDto } from './dto/update-technology-segment.dto.js';
import { TechnologySegmentService } from './technology-segment.service.js';
export declare class TechnologySegmentController {
    private readonly technologySegmentService;
    constructor(technologySegmentService: TechnologySegmentService);
    create(technologyId: string, dto: CreateTechnologySegmentDto): Promise<TechnologySegment>;
    findAll(technologyId: string): Promise<TechnologySegment[]>;
    findOne(technologyId: string, segmentId: string): Promise<TechnologySegment>;
    update(technologyId: string, segmentId: string, dto: UpdateTechnologySegmentDto): Promise<TechnologySegment>;
}
