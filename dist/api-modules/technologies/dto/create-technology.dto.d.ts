import { TechnologyStatus } from '@prisma/client';
export declare class CreateTechnologyDto {
    name: string;
    description: string;
    status: TechnologyStatus;
}
