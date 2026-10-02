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
exports.TechnologyController = void 0;
const common_1 = require("@nestjs/common");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const platform_admin_guard_js_1 = require("../auth/guards/platform-admin.guard.js");
const create_technology_dto_js_1 = require("./dto/create-technology.dto.js");
const update_technology_dto_js_1 = require("./dto/update-technology.dto.js");
const technology_service_js_1 = require("./technology.service.js");
let TechnologyController = class TechnologyController {
    technologyService;
    constructor(technologyService) {
        this.technologyService = technologyService;
    }
    async create(dto) {
        return this.technologyService.create(dto);
    }
    async findAll() {
        return this.technologyService.findAll();
    }
    async findOne(technologyId) {
        return this.technologyService.findOne(technologyId);
    }
    async update(technologyId, dto) {
        return this.technologyService.update(technologyId, dto);
    }
};
exports.TechnologyController = TechnologyController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_technology_dto_js_1.CreateTechnologyDto]),
    __metadata("design:returntype", Promise)
], TechnologyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TechnologyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TechnologyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_technology_dto_js_1.UpdateTechnologyDto]),
    __metadata("design:returntype", Promise)
], TechnologyController.prototype, "update", null);
exports.TechnologyController = TechnologyController = __decorate([
    (0, common_1.Controller)('technologies'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [technology_service_js_1.TechnologyService])
], TechnologyController);
//# sourceMappingURL=technology.controller.js.map