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
exports.VacancyQuestionSetController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const add_vacancy_question_dto_js_1 = require("./dto/add-vacancy-question.dto.js");
const create_vacancy_custom_question_dto_js_1 = require("./dto/create-vacancy-custom-question.dto.js");
const update_vacancy_question_dto_js_1 = require("./dto/update-vacancy-question.dto.js");
const update_vacancy_custom_question_dto_js_1 = require("./dto/update-vacancy-custom-question.dto.js");
const query_questions_dto_js_1 = require("../questions/dto/query-questions.dto.js");
const vacancy_question_set_service_js_1 = require("./vacancy-question-set.service.js");
let VacancyQuestionSetController = class VacancyQuestionSetController {
    vacancyQuestionSetService;
    constructor(vacancyQuestionSetService) {
        this.vacancyQuestionSetService = vacancyQuestionSetService;
    }
    async findAll(user, vacancyId) {
        return this.vacancyQuestionSetService.findAll(user, vacancyId);
    }
    async findAvailable(user, vacancyId, query) {
        return this.vacancyQuestionSetService.findAvailable(user, vacancyId, query);
    }
    async add(user, vacancyId, dto) {
        return this.vacancyQuestionSetService.add(user, vacancyId, dto);
    }
    async findAllCustom(user, vacancyId) {
        return this.vacancyQuestionSetService.findAllCustom(user, vacancyId);
    }
    async createCustom(user, vacancyId, dto) {
        return this.vacancyQuestionSetService.createCustom(user, vacancyId, dto);
    }
    async updateCustom(user, vacancyId, customQuestionId, dto) {
        return this.vacancyQuestionSetService.updateCustom(user, vacancyId, customQuestionId, dto);
    }
    async removeCustom(user, vacancyId, customQuestionId) {
        await this.vacancyQuestionSetService.removeCustom(user, vacancyId, customQuestionId);
    }
    async update(user, vacancyId, vacancyQuestionId, dto) {
        return this.vacancyQuestionSetService.update(user, vacancyId, vacancyQuestionId, dto);
    }
    async remove(user, vacancyId, vacancyQuestionId) {
        await this.vacancyQuestionSetService.remove(user, vacancyId, vacancyQuestionId);
    }
};
exports.VacancyQuestionSetController = VacancyQuestionSetController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_questions_dto_js_1.QueryQuestionsDto]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "findAvailable", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_vacancy_question_dto_js_1.AddVacancyQuestionDto]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "add", null);
__decorate([
    (0, common_1.Get)('custom'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "findAllCustom", null);
__decorate([
    (0, common_1.Post)('custom'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_vacancy_custom_question_dto_js_1.CreateVacancyCustomQuestionDto]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "createCustom", null);
__decorate([
    (0, common_1.Patch)('custom/:id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_vacancy_custom_question_dto_js_1.UpdateVacancyCustomQuestionDto]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "updateCustom", null);
__decorate([
    (0, common_1.Delete)('custom/:id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "removeCustom", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_vacancy_question_dto_js_1.UpdateVacancyQuestionDto]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyQuestionSetController.prototype, "remove", null);
exports.VacancyQuestionSetController = VacancyQuestionSetController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/questions'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [vacancy_question_set_service_js_1.VacancyQuestionSetService])
], VacancyQuestionSetController);
//# sourceMappingURL=vacancy-question-set.controller.js.map