import { AssessmentAreaImportance } from '@prisma/client';
export declare class CreateExperienceCompetencyQuestionDto {
    questionText: string;
}
export declare class CreateExperienceCompetencyAreaDto {
    name: string;
    importance: AssessmentAreaImportance;
    reason: string;
    whatToEstablish: string[];
    questions: CreateExperienceCompetencyQuestionDto[];
}
