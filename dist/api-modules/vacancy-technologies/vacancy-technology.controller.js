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
exports.VacancyTechnologyController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const create_vacancy_technology_dto_js_1 = require("./dto/create-vacancy-technology.dto.js");
const update_vacancy_technology_dto_js_1 = require("./dto/update-vacancy-technology.dto.js");
const vacancy_technology_service_js_1 = require("./vacancy-technology.service.js");
let VacancyTechnologyController = class VacancyTechnologyController {
    vacancyTechnologyService;
    constructor(vacancyTechnologyService) {
        this.vacancyTechnologyService = vacancyTechnologyService;
    }
    async create(user, vacancyId, dto) {
        return this.vacancyTechnologyService.create(user, vacancyId, dto);
    }
    async findAll(user, vacancyId) {
        return this.vacancyTechnologyService.findAll(user, vacancyId);
    }
    async update(user, vacancyId, vacancyTechnologyId, dto) {
        return this.vacancyTechnologyService.update(user, vacancyId, vacancyTechnologyId, dto);
    }
    async remove(user, vacancyId, vacancyTechnologyId) {
        await this.vacancyTechnologyService.remove(user, vacancyId, vacancyTechnologyId);
    }
};
exports.VacancyTechnologyController = VacancyTechnologyController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_vacancy_technology_dto_js_1.CreateVacancyTechnologyDto]),
    __metadata("design:returntype", Promise)
], VacancyTechnologyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyTechnologyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_vacancy_technology_dto_js_1.UpdateVacancyTechnologyDto]),
    __metadata("design:returntype", Promise)
], VacancyTechnologyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyTechnologyController.prototype, "remove", null);
exports.VacancyTechnologyController = VacancyTechnologyController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/technologies'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [vacancy_technology_service_js_1.VacancyTechnologyService])
], VacancyTechnologyController);
//# sourceMappingURL=vacancy-technology.controller.js.map