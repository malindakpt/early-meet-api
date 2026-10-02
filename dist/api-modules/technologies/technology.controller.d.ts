import type { Technology } from '@prisma/client';
import { CreateTechnologyDto } from './dto/create-technology.dto.js';
import { UpdateTechnologyDto } from './dto/update-technology.dto.js';
import { TechnologyService } from './technology.service.js';
export declare class TechnologyController {
    private readonly technologyService;
    constructor(technologyService: TechnologyService);
    create(dto: CreateTechnologyDto): Promise<Technology>;
    findAll(): Promise<Technology[]>;
    findOne(technologyId: string): Promise<Technology>;
    update(technologyId: string, dto: UpdateTechnologyDto): Promise<Technology>;
}
