"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyQuestionGenerationModule = void 0;
const common_1 = require("@nestjs/common");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const auth_module_js_1 = require("../auth/auth.module.js");
const ai_module_js_1 = require("../ai/ai.module.js");
const question_module_js_1 = require("../questions/question.module.js");
const vacancy_technology_module_js_1 = require("../vacancy-technologies/vacancy-technology.module.js");
const vacancy_module_js_1 = require("../vacancies/vacancy.module.js");
const vacancy_question_generation_controller_js_1 = require("./vacancy-question-generation.controller.js");
const vacancy_assessment_suggestion_controller_js_1 = require("./vacancy-assessment-suggestion.controller.js");
const vacancy_assessment_suggestion_service_js_1 = require("./vacancy-assessment-suggestion.service.js");
const vacancy_assessment_suggestion_scheduler_service_js_1 = require("./vacancy-assessment-suggestion-scheduler.service.js");
const vacancy_experience_competency_controller_js_1 = require("./vacancy-experience-competency.controller.js");
const vacancy_experience_competency_service_js_1 = require("./vacancy-experience-competency.service.js");
const vacancy_question_generation_service_js_1 = require("./vacancy-question-generation.service.js");
const vacancy_question_set_controller_js_1 = require("./vacancy-question-set.controller.js");
const vacancy_question_set_service_js_1 = require("./vacancy-question-set.service.js");
let VacancyQuestionGenerationModule = class VacancyQuestionGenerationModule {
};
exports.VacancyQuestionGenerationModule = VacancyQuestionGenerationModule;
exports.VacancyQuestionGenerationModule = VacancyQuestionGenerationModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_js_1.AiModule, auth_module_js_1.AuthModule, question_module_js_1.QuestionModule, vacancy_module_js_1.VacancyModule, vacancy_technology_module_js_1.VacancyTechnologyModule],
        controllers: [
            vacancy_question_generation_controller_js_1.VacancyQuestionGenerationController,
            vacancy_question_set_controller_js_1.VacancyQuestionSetController,
            vacancy_assessment_suggestion_controller_js_1.VacancyAssessmentSuggestionController,
            vacancy_experience_competency_controller_js_1.VacancyExperienceCompetencyController,
        ],
        providers: [
            vacancy_question_generation_service_js_1.VacancyQuestionGenerationService,
            vacancy_question_set_service_js_1.VacancyQuestionSetService,
            vacancy_assessment_suggestion_service_js_1.VacancyAssessmentSuggestionService,
            vacancy_assessment_suggestion_scheduler_service_js_1.VacancyAssessmentSuggestionScheduler,
            vacancy_experience_competency_service_js_1.VacancyExperienceCompetencyService,
            structured_logger_service_js_1.StructuredLogger,
        ],
        exports: [vacancy_question_set_service_js_1.VacancyQuestionSetService],
    })
], VacancyQuestionGenerationModule);
//# sourceMappingURL=vacancy-question-generation.module.js.map