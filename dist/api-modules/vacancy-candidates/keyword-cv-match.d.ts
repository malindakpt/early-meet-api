export interface IKeywordMatchTechnology {
    requirementType: 'PREFERRED' | 'REQUIRED';
    segments: Array<{
        name: string;
    }>;
    technology: {
        name: string;
    };
}
export interface IKeywordMatchResult {
    matchedSegments: string[];
    matchedTechnologies: string[];
    preferredMatched: number;
    preferredTotal: number;
    requiredMatched: number;
    requiredTotal: number;
    score: number;
}
export declare function calculateKeywordMatch(cvText: string, vacancyTechnologies: IKeywordMatchTechnology[]): IKeywordMatchResult;
