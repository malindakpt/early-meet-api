"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const candidate_evaluation_types_js_1 = require("./candidate-evaluation.types.js");
const assessment_area_suggestion_types_js_1 = require("./assessment-area-suggestion.types.js");
const cv_extraction_types_js_1 = require("./cv-extraction.types.js");
const interview_answer_evaluation_types_js_1 = require("./interview-answer-evaluation.types.js");
const interview_follow_up_types_js_1 = require("./interview-follow-up.types.js");
const interview_overall_evaluation_types_js_1 = require("./interview-overall-evaluation.types.js");
const openai_candidate_evaluation_service_js_1 = require("./openai-candidate-evaluation.service.js");
const openai_cv_extraction_service_js_1 = require("./openai-cv-extraction.service.js");
const openai_interview_answer_evaluation_service_js_1 = require("./openai-interview-answer-evaluation.service.js");
const openai_interview_follow_up_service_js_1 = require("./openai-interview-follow-up.service.js");
const openai_interview_overall_evaluation_service_js_1 = require("./openai-interview-overall-evaluation.service.js");
const openai_assessment_area_suggestion_service_js_1 = require("./openai-assessment-area-suggestion.service.js");
const configuration_values_js_1 = require("../../infrastructure/config/configuration-values.js");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: openai_cv_extraction_service_js_1.OPENAI_CLIENT,
                inject: [config_1.ConfigService],
                useFactory: (config) => new openai_1.default({
                    apiKey: config.getOrThrow('OPENAI_API_KEY'),
                    maxRetries: configuration_values_js_1.configurationValues.openAi.maxRetries,
                    timeout: config.getOrThrow('OPENAI_TIMEOUT_MS'),
                }),
            },
            {
                provide: openai_cv_extraction_service_js_1.OPENAI_CV_MODEL,
                inject: [config_1.ConfigService],
                useFactory: (config) => config.getOrThrow('OPENAI_CV_EXTRACTION_MODEL'),
            },
            {
                provide: openai_candidate_evaluation_service_js_1.OPENAI_CANDIDATE_EVALUATION_MODEL,
                inject: [config_1.ConfigService],
                useFactory: (config) => config.getOrThrow('OPENAI_CANDIDATE_EVALUATION_MODEL'),
            },
            openai_cv_extraction_service_js_1.OpenAiCvExtractionService,
            openai_candidate_evaluation_service_js_1.OpenAiCandidateEvaluationService,
            openai_interview_answer_evaluation_service_js_1.OpenAiInterviewAnswerEvaluationService,
            openai_interview_follow_up_service_js_1.OpenAiInterviewFollowUpService,
            openai_interview_overall_evaluation_service_js_1.OpenAiInterviewOverallEvaluationService,
            openai_assessment_area_suggestion_service_js_1.OpenAiAssessmentAreaSuggestionService,
            {
                provide: assessment_area_suggestion_types_js_1.ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE,
                useExisting: openai_assessment_area_suggestion_service_js_1.OpenAiAssessmentAreaSuggestionService,
            },
            {
                provide: cv_extraction_types_js_1.CV_EXTRACTION_SERVICE,
                useExisting: openai_cv_extraction_service_js_1.OpenAiCvExtractionService,
            },
            {
                provide: candidate_evaluation_types_js_1.CANDIDATE_EVALUATION_LLM_SERVICE,
                useExisting: openai_candidate_evaluation_service_js_1.OpenAiCandidateEvaluationService,
            },
            {
                provide: interview_answer_evaluation_types_js_1.INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE,
                useExisting: openai_interview_answer_evaluation_service_js_1.OpenAiInterviewAnswerEvaluationService,
            },
            {
                provide: interview_follow_up_types_js_1.INTERVIEW_FOLLOW_UP_LLM_SERVICE,
                useExisting: openai_interview_follow_up_service_js_1.OpenAiInterviewFollowUpService,
            },
            {
                provide: interview_overall_evaluation_types_js_1.INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE,
                useExisting: openai_interview_overall_evaluation_service_js_1.OpenAiInterviewOverallEvaluationService,
            },
        ],
        exports: [
            assessment_area_suggestion_types_js_1.ASSESSMENT_AREA_SUGGESTION_LLM_SERVICE,
            candidate_evaluation_types_js_1.CANDIDATE_EVALUATION_LLM_SERVICE,
            cv_extraction_types_js_1.CV_EXTRACTION_SERVICE,
            interview_answer_evaluation_types_js_1.INTERVIEW_ANSWER_EVALUATION_LLM_SERVICE,
            interview_follow_up_types_js_1.INTERVIEW_FOLLOW_UP_LLM_SERVICE,
            interview_overall_evaluation_types_js_1.INTERVIEW_OVERALL_EVALUATION_LLM_SERVICE,
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map