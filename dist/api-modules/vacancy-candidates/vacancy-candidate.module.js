"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyCandidateModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_js_1 = require("../auth/auth.module.js");
const candidate_module_js_1 = require("../candidates/candidate.module.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const vacancy_module_js_1 = require("../vacancies/vacancy.module.js");
const vacancy_technology_module_js_1 = require("../vacancy-technologies/vacancy-technology.module.js");
const candidate_ranking_service_js_1 = require("./candidate-ranking.service.js");
const public_application_controller_js_1 = require("./public-application.controller.js");
const vacancy_candidate_controller_js_1 = require("./vacancy-candidate.controller.js");
const vacancy_candidate_service_js_1 = require("./vacancy-candidate.service.js");
let VacancyCandidateModule = class VacancyCandidateModule {
};
exports.VacancyCandidateModule = VacancyCandidateModule;
exports.VacancyCandidateModule = VacancyCandidateModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_js_1.AuthModule, candidate_module_js_1.CandidateModule, vacancy_module_js_1.VacancyModule, vacancy_technology_module_js_1.VacancyTechnologyModule],
        controllers: [public_application_controller_js_1.PublicApplicationController, vacancy_candidate_controller_js_1.VacancyCandidateController],
        providers: [candidate_ranking_service_js_1.CandidateRankingService, structured_logger_service_js_1.StructuredLogger, vacancy_candidate_service_js_1.VacancyCandidateService],
        exports: [vacancy_candidate_service_js_1.VacancyCandidateService],
    })
], VacancyCandidateModule);
//# sourceMappingURL=vacancy-candidate.module.js.map