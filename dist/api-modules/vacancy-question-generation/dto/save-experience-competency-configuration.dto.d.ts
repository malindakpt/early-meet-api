import { AssessmentAreaImportance } from '@prisma/client';
export declare class SaveExperienceCompetencyQuestionDto {
    questionText: string;
}
export declare class SaveExperienceCompetencyAreaDto {
    name: string;
    importance?: AssessmentAreaImportance;
    questions: SaveExperienceCompetencyQuestionDto[];
}
export declare class SaveExperienceCompetencyConfigurationDto {
    areas: SaveExperienceCompetencyAreaDto[];
}
