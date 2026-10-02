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
exports.TechnologySegmentController = void 0;
const common_1 = require("@nestjs/common");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const platform_admin_guard_js_1 = require("../auth/guards/platform-admin.guard.js");
const create_technology_segment_dto_js_1 = require("./dto/create-technology-segment.dto.js");
const update_technology_segment_dto_js_1 = require("./dto/update-technology-segment.dto.js");
const technology_segment_service_js_1 = require("./technology-segment.service.js");
let TechnologySegmentController = class TechnologySegmentController {
    technologySegmentService;
    constructor(technologySegmentService) {
        this.technologySegmentService = technologySegmentService;
    }
    async create(technologyId, dto) {
        return this.technologySegmentService.create(technologyId, dto);
    }
    async findAll(technologyId) {
        return this.technologySegmentService.findAll(technologyId);
    }
    async findOne(technologyId, segmentId) {
        return this.technologySegmentService.findOne(technologyId, segmentId);
    }
    async update(technologyId, segmentId, dto) {
        return this.technologySegmentService.update(technologyId, segmentId, dto);
    }
};
exports.TechnologySegmentController = TechnologySegmentController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Param)('technologyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_technology_segment_dto_js_1.CreateTechnologySegmentDto]),
    __metadata("design:returntype", Promise)
], TechnologySegmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('technologyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TechnologySegmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('technologyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TechnologySegmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Param)('technologyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_technology_segment_dto_js_1.UpdateTechnologySegmentDto]),
    __metadata("design:returntype", Promise)
], TechnologySegmentController.prototype, "update", null);
exports.TechnologySegmentController = TechnologySegmentController = __decorate([
    (0, common_1.Controller)('technologies/:technologyId/segments'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [technology_segment_service_js_1.TechnologySegmentService])
], TechnologySegmentController);
//# sourceMappingURL=technology-segment.controller.js.map