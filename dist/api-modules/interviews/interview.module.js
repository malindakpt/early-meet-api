"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewModule = void 0;
const common_1 = require("@nestjs/common");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const auth_module_js_1 = require("../auth/auth.module.js");
const ai_module_js_1 = require("../ai/ai.module.js");
const email_module_js_1 = require("../email/email.module.js");
const vacancy_candidate_module_js_1 = require("../vacancy-candidates/vacancy-candidate.module.js");
const vacancy_question_generation_module_js_1 = require("../vacancy-question-generation/vacancy-question-generation.module.js");
const vacancy_module_js_1 = require("../vacancies/vacancy.module.js");
const candidate_interview_controller_js_1 = require("./candidate-interview.controller.js");
const interview_controller_js_1 = require("./interview.controller.js");
const interview_review_controller_js_1 = require("./interview-review.controller.js");
const interview_answer_evaluation_service_js_1 = require("./interview-answer-evaluation.service.js");
const interview_evaluation_scheduler_service_js_1 = require("./interview-evaluation-scheduler.service.js");
const interview_follow_up_service_js_1 = require("./interview-follow-up.service.js");
const interview_overall_evaluation_service_js_1 = require("./interview-overall-evaluation.service.js");
const interview_service_js_1 = require("./interview.service.js");
let InterviewModule = class InterviewModule {
};
exports.InterviewModule = InterviewModule;
exports.InterviewModule = InterviewModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ai_module_js_1.AiModule,
            auth_module_js_1.AuthModule,
            email_module_js_1.EmailModule,
            vacancy_candidate_module_js_1.VacancyCandidateModule,
            vacancy_module_js_1.VacancyModule,
            vacancy_question_generation_module_js_1.VacancyQuestionGenerationModule,
        ],
        controllers: [interview_controller_js_1.InterviewController, candidate_interview_controller_js_1.CandidateInterviewController, interview_review_controller_js_1.InterviewReviewController],
        providers: [
            interview_answer_evaluation_service_js_1.InterviewAnswerEvaluationService,
            interview_evaluation_scheduler_service_js_1.InterviewEvaluationScheduler,
            interview_follow_up_service_js_1.InterviewFollowUpService,
            interview_overall_evaluation_service_js_1.InterviewOverallEvaluationService,
            interview_service_js_1.InterviewService,
            structured_logger_service_js_1.StructuredLogger,
        ],
    })
], InterviewModule);
//# sourceMappingURL=interview.module.js.map