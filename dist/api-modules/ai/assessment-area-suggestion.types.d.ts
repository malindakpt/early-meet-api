import { z } from 'zod';
export declare const assessmentAreaSchema: z.ZodObject<{
    importance: z.ZodEnum<{
        HIGH: "HIGH";
        MEDIUM: "MEDIUM";
        LOW: "LOW";
    }>;
    name: z.ZodString;
}, z.core.$strip>;
export declare const roleAnalysisSchema: z.ZodObject<{
    experienceAreas: z.ZodArray<z.ZodObject<{
        importance: z.ZodEnum<{
            HIGH: "HIGH";
            MEDIUM: "MEDIUM";
            LOW: "LOW";
        }>;
        name: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type IAssessmentArea = z.infer<typeof assessmentAreaSchema>;
export type IRoleAnalysis = z.infer<typeof roleAnalysisSchema>;
export interface IAssessmentAreaSuggestionLlmService {
    analyzeRole(input: IRoleAnalysisInput): Promise<IRoleAnalysis>;
}
export interface IRoleAnalysisInput {
    jobDescription: string;
    seniority: string;
    vacancyTitle: string;
}
export declare const ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE: unique symbol;
