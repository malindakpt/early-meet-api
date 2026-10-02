"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyAssessmentSuggestionController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const vacancy_assessment_suggestion_service_js_1 = require("./vacancy-assessment-suggestion.service.js");
const vacancy_assessment_suggestion_scheduler_service_js_1 = require("./vacancy-assessment-suggestion-scheduler.service.js");
let VacancyAssessmentSuggestionController = class VacancyAssessmentSuggestionController {
    vacancyAssessmentSuggestionService;
    vacancyAssessmentSuggestionScheduler;
    constructor(vacancyAssessmentSuggestionService, vacancyAssessmentSuggestionScheduler) {
        this.vacancyAssessmentSuggestionService = vacancyAssessmentSuggestionService;
        this.vacancyAssessmentSuggestionScheduler = vacancyAssessmentSuggestionScheduler;
    }
    async suggest(user, vacancyId) {
        const generation = await this.vacancyAssessmentSuggestionService.start(user, vacancyId);
        this.vacancyAssessmentSuggestionScheduler.schedule(generation.generationId);
        return generation;
    }
    async findCurrent(user, vacancyId) {
        return this.vacancyAssessmentSuggestionService.findCurrent(user, vacancyId);
    }
};
exports.VacancyAssessmentSuggestionController = VacancyAssessmentSuggestionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(202),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyAssessmentSuggestionController.prototype, "suggest", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyAssessmentSuggestionController.prototype, "findCurrent", null);
exports.VacancyAssessmentSuggestionController = VacancyAssessmentSuggestionController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/assessment-area-suggestions'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [vacancy_assessment_suggestion_service_js_1.VacancyAssessmentSuggestionService,
        vacancy_assessment_suggestion_scheduler_service_js_1.VacancyAssessmentSuggestionScheduler])
], VacancyAssessmentSuggestionController);
//# sourceMappingURL=vacancy-assessment-suggestion.controller.js.map