"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE = exports.roleAnalysisSchema = exports.assessmentAreaSchema = void 0;
const zod_1 = require("zod");
exports.assessmentAreaSchema = zod_1.z.object({
    importance: zod_1.z.enum(['HIGH', 'MEDIUM', 'LOW']),
    name: zod_1.z.string().trim().min(1).max(120),
});
exports.roleAnalysisSchema = zod_1.z.object({
    experienceAreas: zod_1.z.array(exports.assessmentAreaSchema).min(1).max(20),
});
exports.ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE = Symbol('ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE');
//# sourceMappingURL=assessment-area-suggestion.types.js.map