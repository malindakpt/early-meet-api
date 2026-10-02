"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE = exports.interviewAnswerEvaluationSchema = void 0;
const zod_1 = require("zod");
exports.interviewAnswerEvaluationSchema = zod_1.z.object({
    explanation: zod_1.z.string().trim().min(1).max(4_000),
    score: zod_1.z.number().finite().min(0).max(100),
});
exports.INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE = Symbol('INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE');
//# sourceMappingURL=interview-answer-evaluation.types.js.map