"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE = exports.interviewOverallEvaluationSchema = exports.interviewAssessmentLevelSchema = void 0;
const zod_1 = require("zod");
exports.interviewAssessmentLevelSchema = zod_1.z.enum([
    'STRONG',
    'GOOD',
    'MODERATE',
    'WEAK',
    'NO_EVIDENCE',
]);
exports.interviewOverallEvaluationSchema = zod_1.z.object({
    areasToProbe: zod_1.z
        .array(zod_1.z.object({
        questionIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(5),
        text: zod_1.z.string().trim().min(1).max(500),
    }))
        .max(5),
    competencies: zod_1.z.object({
        communication: exports.interviewAssessmentLevelSchema,
        problemSolving: exports.interviewAssessmentLevelSchema,
        technicalDepth: exports.interviewAssessmentLevelSchema,
    }),
    skills: zod_1.z
        .array(zod_1.z.object({
        evidence: zod_1.z.string().trim().min(1).max(500),
        level: exports.interviewAssessmentLevelSchema,
        vacancyTechnologyId: zod_1.z.string().uuid(),
    }))
        .max(100),
    strengths: zod_1.z
        .array(zod_1.z.object({
        questionIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(5),
        text: zod_1.z.string().trim().min(1).max(500),
    }))
        .max(5),
    summary: zod_1.z.string().trim().min(1).max(1_000),
});
exports.INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE = Symbol('INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE');
//# sourceMappingURL=interview-overall-evaluation.types.js.map