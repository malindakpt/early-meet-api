import { z } from 'zod';
export declare const candidateEvaluationSchema: z.ZodObject<{
    cv: z.ZodObject<{
        candidate: z.ZodObject<{
            fullName: z.ZodNullable<z.ZodString>;
            email: z.ZodNullable<z.ZodString>;
            phone: z.ZodNullable<z.ZodString>;
            location: z.ZodNullable<z.ZodString>;
            linkedInUrl: z.ZodNullable<z.ZodString>;
            portfolioUrl: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>;
        summary: z.ZodNullable<z.ZodString>;
        skills: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            category: z.ZodNullable<z.ZodString>;
            yearsOfExperience: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>;
        workExperience: z.ZodArray<z.ZodObject<{
            company: z.ZodNullable<z.ZodString>;
            jobTitle: z.ZodNullable<z.ZodString>;
            location: z.ZodNullable<z.ZodString>;
            startDate: z.ZodNullable<z.ZodString>;
            endDate: z.ZodNullable<z.ZodString>;
            isCurrent: z.ZodBoolean;
            description: z.ZodNullable<z.ZodString>;
            technologies: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        education: z.ZodArray<z.ZodObject<{
            institution: z.ZodNullable<z.ZodString>;
            degree: z.ZodNullable<z.ZodString>;
            fieldOfStudy: z.ZodNullable<z.ZodString>;
            startDate: z.ZodNullable<z.ZodString>;
            endDate: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        certifications: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            issuer: z.ZodNullable<z.ZodString>;
            issueDate: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    score: z.ZodNumber;
    summary: z.ZodString;
    matchedRequirements: z.ZodArray<z.ZodString>;
    missingRequirements: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ICandidateEvaluation = z.infer<typeof candidateEvaluationSchema>;
export interface ICandidateEvaluationLlmService {
    evaluate(input: ICandidateEvaluationInput): Promise<ICandidateEvaluation>;
}
export interface ICandidateEvaluationInput {
    cvText: string;
    vacancy: {
        description: string;
        employmentType: string;
        experienceMax: number;
        experienceMin: number;
        technologies: Array<{
            name: string;
            requirementType: 'PREFERRED' | 'REQUIRED';
            segments: string[];
        }>;
        title: string;
        workType: string;
    };
}
export declare const CANDIDATE_EVALUATION_LLM_SERVICE: unique symbol;
