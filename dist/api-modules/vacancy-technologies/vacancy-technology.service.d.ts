import { Prisma, type TechnologySegment } from '@prisma/client';
import type { IAuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { TechnologyService } from '../technologies/technology.service.js';
import { TechnologySegmentService } from '../technology-segments/technology-segment.service.js';
import { VacancyService } from '../vacancies/vacancy.service.js';
import type { IKeywordMatchTechnology } from '../vacancy-candidates/keyword-cv-match.js';
import type { CreateVacancyTechnologyDto } from './dto/create-vacancy-technology.dto.js';
import type { UpdateVacancyTechnologyDto } from './dto/update-vacancy-technology.dto.js';
declare const technologySelect: {
    readonly id: true;
    readonly name: true;
    readonly description: true;
    readonly status: true;
};
type IVacancyTechnologyRecord = Prisma.VacancyTechnologyGetPayload<{
    include: {
        technology: {
            select: typeof technologySelect;
        };
    };
}>;
export interface IVacancyTechnologyResponse extends IVacancyTechnologyRecord {
    segments: Array<Pick<TechnologySegment, 'id' | 'name'>>;
}
export declare class VacancyTechnologyService {
    private readonly prisma;
    private readonly vacancyService;
    private readonly technologyService;
    private readonly technologySegmentService;
    constructor(prisma: PrismaService, vacancyService: VacancyService, technologyService: TechnologyService, technologySegmentService: TechnologySegmentService);
    create(user: IAuthenticatedUser, vacancyId: string, dto: CreateVacancyTechnologyDto): Promise<IVacancyTechnologyResponse>;
    findAll(user: IAuthenticatedUser, vacancyId: string): Promise<IVacancyTechnologyResponse[]>;
    update(user: IAuthenticatedUser, vacancyId: string, vacancyTechnologyId: string, dto: UpdateVacancyTechnologyDto): Promise<IVacancyTechnologyResponse>;
    remove(user: IAuthenticatedUser, vacancyId: string, vacancyTechnologyId: string): Promise<void>;
    findKeywordMatchTechnologies(vacancyId: string): Promise<IKeywordMatchTechnology[]>;
    resolveSegments(technologyId: string, segmentSelections: string[]): Promise<Array<Pick<TechnologySegment, 'id' | 'name'>>>;
    private findRelationship;
    private normalizeSegmentSelections;
    private toResponse;
    private rethrowDuplicateTechnology;
}
export {};
