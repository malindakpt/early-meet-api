"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateVacancyMatchingModule = void 0;
const common_1 = require("@nestjs/common");
const ai_module_js_1 = require("../ai/ai.module.js");
const auth_module_js_1 = require("../auth/auth.module.js");
const vacancy_candidate_module_js_1 = require("../vacancy-candidates/vacancy-candidate.module.js");
const vacancy_technology_module_js_1 = require("../vacancy-technologies/vacancy-technology.module.js");
const vacancy_module_js_1 = require("../vacancies/vacancy.module.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const candidate_vacancy_matching_controller_js_1 = require("./candidate-vacancy-matching.controller.js");
const candidate_vacancy_evaluation_scheduler_service_js_1 = require("./candidate-vacancy-evaluation-scheduler.service.js");
const candidate_vacancy_evaluation_service_js_1 = require("./candidate-vacancy-evaluation.service.js");
const candidate_vacancy_matching_service_js_1 = require("./candidate-vacancy-matching.service.js");
const match_score_calculator_service_js_1 = require("./match-score-calculator.service.js");
const technology_matching_service_js_1 = require("./technology-matching.service.js");
let CandidateVacancyMatchingModule = class CandidateVacancyMatchingModule {
};
exports.CandidateVacancyMatchingModule = CandidateVacancyMatchingModule;
exports.CandidateVacancyMatchingModule = CandidateVacancyMatchingModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_js_1.AiModule, auth_module_js_1.AuthModule, vacancy_candidate_module_js_1.VacancyCandidateModule, vacancy_technology_module_js_1.VacancyTechnologyModule, vacancy_module_js_1.VacancyModule],
        controllers: [candidate_vacancy_matching_controller_js_1.CandidateVacancyAiMatchController, candidate_vacancy_matching_controller_js_1.CandidateVacancyMatchingController],
        providers: [
            structured_logger_service_js_1.StructuredLogger,
            candidate_vacancy_evaluation_scheduler_service_js_1.CandidateVacancyEvaluationScheduler,
            candidate_vacancy_evaluation_service_js_1.CandidateVacancyEvaluationService,
            candidate_vacancy_matching_service_js_1.CandidateVacancyMatchingService,
            match_score_calculator_service_js_1.MatchScoreCalculatorService,
            technology_matching_service_js_1.TechnologyMatchingService,
        ],
    })
], CandidateVacancyMatchingModule);
//# sourceMappingURL=candidate-vacancy-matching.module.js.map