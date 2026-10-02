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
exports.VacancyExperienceCompetencyController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const create_experience_competency_plan_dto_js_1 = require("./dto/create-experience-competency-plan.dto.js");
const save_experience_competency_configuration_dto_js_1 = require("./dto/save-experience-competency-configuration.dto.js");
const update_experience_competency_area_dto_js_1 = require("./dto/update-experience-competency-area.dto.js");
const update_experience_competency_question_dto_js_1 = require("./dto/update-experience-competency-question.dto.js");
const vacancy_experience_competency_service_js_1 = require("./vacancy-experience-competency.service.js");
let VacancyExperienceCompetencyController = class VacancyExperienceCompetencyController {
    vacancyExperienceCompetencyService;
    constructor(vacancyExperienceCompetencyService) {
        this.vacancyExperienceCompetencyService = vacancyExperienceCompetencyService;
    }
    async findAll(user, vacancyId) {
        return this.vacancyExperienceCompetencyService.findAll(user, vacancyId);
    }
    async createPlan(user, vacancyId, dto) {
        return this.vacancyExperienceCompetencyService.createPlan(user, vacancyId, dto);
    }
    async saveConfiguration(user, vacancyId, dto) {
        return this.vacancyExperienceCompetencyService.saveConfiguration(user, vacancyId, dto);
    }
    async updateArea(user, vacancyId, areaId, dto) {
        return this.vacancyExperienceCompetencyService.updateArea(user, vacancyId, areaId, dto);
    }
    async removeArea(user, vacancyId, areaId) {
        await this.vacancyExperienceCompetencyService.removeArea(user, vacancyId, areaId);
    }
    async updateQuestion(user, vacancyId, questionId, dto) {
        return this.vacancyExperienceCompetencyService.updateQuestion(user, vacancyId, questionId, dto);
    }
    async removeQuestion(user, vacancyId, questionId) {
        await this.vacancyExperienceCompetencyService.removeQuestion(user, vacancyId, questionId);
    }
};
exports.VacancyExperienceCompetencyController = VacancyExperienceCompetencyController;
__decorate([
    (0, common_1.Get)('areas'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('plan'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_experience_competency_plan_dto_js_1.CreateExperienceCompetencyPlanDto]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('configuration'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_experience_competency_configuration_dto_js_1.SaveExperienceCompetencyConfigurationDto]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "saveConfiguration", null);
__decorate([
    (0, common_1.Patch)('areas/:areaId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('areaId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_experience_competency_area_dto_js_1.UpdateExperienceCompetencyAreaDto]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "updateArea", null);
__decorate([
    (0, common_1.Delete)('areas/:areaId'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "removeArea", null);
__decorate([
    (0, common_1.Patch)('questions/:questionId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('questionId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_experience_competency_question_dto_js_1.UpdateExperienceCompetencyQuestionDto]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)('questions/:questionId'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('questionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyExperienceCompetencyController.prototype, "removeQuestion", null);
exports.VacancyExperienceCompetencyController = VacancyExperienceCompetencyController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/experience-competency'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [vacancy_experience_competency_service_js_1.VacancyExperienceCompetencyService])
], VacancyExperienceCompetencyController);
//# sourceMappingURL=vacancy-experience-competency.controller.js.map