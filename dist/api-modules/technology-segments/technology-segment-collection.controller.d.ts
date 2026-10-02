import type { TechnologySegment } from '@prisma/client';
import { TechnologySegmentService } from './technology-segment.service.js';
export declare class TechnologySegmentCollectionController {
    private readonly technologySegmentService;
    constructor(technologySegmentService: TechnologySegmentService);
    findAll(): Promise<TechnologySegment[]>;
}
