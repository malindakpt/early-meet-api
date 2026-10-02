import { AssessmentAreaImportance } from '@prisma/client';
export declare class UpdateExperienceCompetencyAreaDto {
    name?: string;
    importance?: AssessmentAreaImportance;
    reason?: string;
    whatToEstablish?: string[];
}
