import type { IExtractedCvData } from '../ai/cv-extraction.types.js';
export interface ITechnologyMatchResult {
    preferredTechnologiesMet: string[];
    requiredTechnologiesMet: string[];
}
export interface IVacancyTechnologyForMatching {
    name: string;
    requirementType: 'PREFERRED' | 'REQUIRED';
}
export declare class TechnologyMatchingService {
    matchExtractedCv(extractedData: IExtractedCvData, vacancyTechnologies: IVacancyTechnologyForMatching[]): ITechnologyMatchResult;
    match(candidateSkillNames: string[], vacancyTechnologies: IVacancyTechnologyForMatching[]): ITechnologyMatchResult;
}
