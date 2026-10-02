import { RequirementType } from '@prisma/client';
export declare class CreateVacancyTechnologyDto {
    technologyId: string;
    segmentSelections: string[];
    requirementType: RequirementType;
}
