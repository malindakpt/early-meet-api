"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyTechnologyModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_js_1 = require("../auth/auth.module.js");
const technology_module_js_1 = require("../technologies/technology.module.js");
const technology_segment_module_js_1 = require("../technology-segments/technology-segment.module.js");
const vacancy_module_js_1 = require("../vacancies/vacancy.module.js");
const vacancy_technology_controller_js_1 = require("./vacancy-technology.controller.js");
const vacancy_technology_service_js_1 = require("./vacancy-technology.service.js");
let VacancyTechnologyModule = class VacancyTechnologyModule {
};
exports.VacancyTechnologyModule = VacancyTechnologyModule;
exports.VacancyTechnologyModule = VacancyTechnologyModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_js_1.AuthModule, technology_module_js_1.TechnologyModule, technology_segment_module_js_1.TechnologySegmentModule, vacancy_module_js_1.VacancyModule],
        controllers: [vacancy_technology_controller_js_1.VacancyTechnologyController],
        providers: [vacancy_technology_service_js_1.VacancyTechnologyService],
        exports: [vacancy_technology_service_js_1.VacancyTechnologyService],
    })
], VacancyTechnologyModule);
//# sourceMappingURL=vacancy-technology.module.js.map