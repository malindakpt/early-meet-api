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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnologySegmentCollectionController = void 0;
const common_1 = require("@nestjs/common");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const platform_admin_guard_js_1 = require("../auth/guards/platform-admin.guard.js");
const technology_segment_service_js_1 = require("./technology-segment.service.js");
let TechnologySegmentCollectionController = class TechnologySegmentCollectionController {
    technologySegmentService;
    constructor(technologySegmentService) {
        this.technologySegmentService = technologySegmentService;
    }
    async findAll() {
        return this.technologySegmentService.findAllAcrossTechnologies();
    }
};
exports.TechnologySegmentCollectionController = TechnologySegmentCollectionController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TechnologySegmentCollectionController.prototype, "findAll", null);
exports.TechnologySegmentCollectionController = TechnologySegmentCollectionController = __decorate([
    (0, common_1.Controller)('technology-segments'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard, platform_admin_guard_js_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [technology_segment_service_js_1.TechnologySegmentService])
], TechnologySegmentCollectionController);
//# sourceMappingURL=technology-segment-collection.controller.js.map