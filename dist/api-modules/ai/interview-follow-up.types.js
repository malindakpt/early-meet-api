"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERVIEW_FOLLOW_UP_LLM_SERVICE = exports.interviewFollowUpSchema = exports.interviewFollowUpOutputSchema = void 0;
const zod_1 = require("zod");
exports.interviewFollowUpOutputSchema = zod_1.z.object({
    shouldFollowUp: zod_1.z.boolean(),
    reason: zod_1.z.string().trim().min(1).max(2_000),
    followUpQuestion: zod_1.z.string().trim().min(1).max(2_000).nullable(),
});
exports.interviewFollowUpSchema = zod_1.z.discriminatedUnion('shouldFollowUp', [
    zod_1.z.object({
        shouldFollowUp: zod_1.z.literal(false),
        reason: zod_1.z.string().trim().min(1).max(2_000),
        followUpQuestion: zod_1.z.null(),
    }),
    zod_1.z.object({
        shouldFollowUp: zod_1.z.literal(true),
        reason: zod_1.z.string().trim().min(1).max(2_000),
        followUpQuestion: zod_1.z.string().trim().min(1).max(2_000),
    }),
]);
exports.INTERVIEW_FOLLOW_UP_LLM_SERVICE = Symbol('INTERVIEW_FOLLOW_UP_LLM_SERVICE');
//# sourceMappingURL=interview-follow-up.types.js.map