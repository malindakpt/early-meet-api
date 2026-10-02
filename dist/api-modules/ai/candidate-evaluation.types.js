"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANDIDATE_EVALUATION_LLM_SERVICE = exports.candidateEvaluationSchema = void 0;
const zod_1 = require("zod");
const cv_extraction_types_js_1 = require("./cv-extraction.types.js");
// One structured response for the HR-triggered AI CV match: the CV extraction (reusing the
// existing CV extraction schema) and the vacancy evaluation are produced by a single model call.
exports.candidateEvaluationSchema = zod_1.z.object({
    cv: cv_extraction_types_js_1.extractedCvDataSchema,
    score: zod_1.z.number().finite().min(0).max(100),
    summary: zod_1.z.string().trim().min(1).max(4_000),
    matchedRequirements: zod_1.z.array(zod_1.z.string().trim().min(1).max(1_000)).max(20),
    missingRequirements: zod_1.z.array(zod_1.z.string().trim().min(1).max(1_000)).max(20),
});
exports.CANDIDATE_EVALUATION_LLM_SERVICE = Symbol('CANDIDATE_EVALUATION_LLM_SERVICE');
//# sourceMappingURL=candidate-evaluation.types.js.map