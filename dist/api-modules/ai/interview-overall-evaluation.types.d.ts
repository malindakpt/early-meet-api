import { z } from 'zod';
export declare const interviewAssessmentLevelSchema: z.ZodEnum<{
    STRONG: "STRONG";
    GOOD: "GOOD";
    MODERATE: "MODERATE";
    WEAK: "WEAK";
    NO_EVIDENCE: "NO_EVIDENCE";
}>;
export declare const interviewOverallEvaluationSchema: z.ZodObject<{
    areasToProbe: z.ZodArray<z.ZodObject<{
        questionIds: z.ZodArray<z.ZodString>;
        text: z.ZodString;
    }, z.core.$strip>>;
    competencies: z.ZodObject<{
        communication: z.ZodEnum<{
            STRONG: "STRONG";
            GOOD: "GOOD";
            MODERATE: "MODERATE";
            WEAK: "WEAK";
            NO_EVIDENCE: "NO_EVIDENCE";
        }>;
        problemSolving: z.ZodEnum<{
            STRONG: "STRONG";
            GOOD: "GOOD";
            MODERATE: "MODERATE";
            WEAK: "WEAK";
            NO_EVIDENCE: "NO_EVIDENCE";
        }>;
        technicalDepth: z.ZodEnum<{
            STRONG: "STRONG";
            GOOD: "GOOD";
            MODERATE: "MODERATE";
            WEAK: "WEAK";
            NO_EVIDENCE: "NO_EVIDENCE";
        }>;
    }, z.core.$strip>;
    skills: z.ZodArray<z.ZodObject<{
        evidence: z.ZodString;
        level: z.ZodEnum<{
            STRONG: "STRONG";
            GOOD: "GOOD";
            MODERATE: "MODERATE";
            WEAK: "WEAK";
            NO_EVIDENCE: "NO_EVIDENCE";
        }>;
        vacancyTechnologyId: z.ZodString;
    }, z.core.$strip>>;
    strengths: z.ZodArray<z.ZodObject<{
        questionIds: z.ZodArray<z.ZodString>;
        text: z.ZodString;
    }, z.core.$strip>>;
    summary: z.ZodString;
}, z.core.$strip>;
export type IInterviewOverallEvaluation = z.infer<typeof interviewOverallEvaluationSchema>;
export interface IInterviewOverallEvaluationInput {
    coreAnswers: Array<{
        answerText: string;
        questionId: string;
        question: {
            difficulty: string;
            evaluationCriteria: unknown;
            questionText: string;
            questionType: string;
            technology: string | null;
            technologySegment: string | null;
        };
        sequence: number;
    }>;
    followUpAnswers: Array<{
        answerText: string;
        parentCoreQuestionId: string;
        questionId: string;
        questionText: string;
    }>;
    vacancy: {
        description: string;
        difficulty: string;
        interviewType: string;
        skills: Array<{
            name: string;
            requirementType: 'PREFERRED' | 'REQUIRED';
            segmentName: string | null;
            vacancyTechnologyId: string;
        }>;
        title: string;
    };
}
export interface IInterviewOverallEvaluationLlmService {
    evaluate(input: IInterviewOverallEvaluationInput): Promise<IInterviewOverallEvaluation>;
}
export declare const INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE: unique symbol;
