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
exports.VacancyController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const create_vacancy_dto_js_1 = require("./dto/create-vacancy.dto.js");
const update_vacancy_dto_js_1 = require("./dto/update-vacancy.dto.js");
const vacancy_service_js_1 = require("./vacancy.service.js");
let VacancyController = class VacancyController {
    vacancyService;
    constructor(vacancyService) {
        this.vacancyService = vacancyService;
    }
    async create(user, dto) {
        return this.vacancyService.create(user, dto);
    }
    async findAll(user) {
        return this.vacancyService.findAll(user);
    }
    async findOne(user, vacancyId) {
        return this.vacancyService.findOne(user, vacancyId);
    }
    async update(user, vacancyId, dto) {
        return this.vacancyService.update(user, vacancyId, dto);
    }
    async remove(user, vacancyId) {
        await this.vacancyService.remove(user, vacancyId);
    }
};
exports.VacancyController = VacancyController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_vacancy_dto_js_1.CreateVacancyDto]),
    __metadata("design:returntype", Promise)
], VacancyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VacancyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_vacancy_dto_js_1.UpdateVacancyDto]),
    __metadata("design:returntype", Promise)
], VacancyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VacancyController.prototype, "remove", null);
exports.VacancyController = VacancyController = __decorate([
    (0, common_1.Controller)('vacancies'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [vacancy_service_js_1.VacancyService])
], VacancyController);
//# sourceMappingURL=vacancy.controller.js.map