import { TechnologyStatus } from '@prisma/client';
export declare class UpdateTechnologyDto {
    name?: string;
    description?: string;
    status?: TechnologyStatus;
}
