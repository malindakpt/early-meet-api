"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_js_1 = require("../auth/auth.module.js");
const vacancy_controller_js_1 = require("./vacancy.controller.js");
const vacancy_service_js_1 = require("./vacancy.service.js");
let VacancyModule = class VacancyModule {
};
exports.VacancyModule = VacancyModule;
exports.VacancyModule = VacancyModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_js_1.AuthModule],
        controllers: [vacancy_controller_js_1.VacancyController],
        providers: [vacancy_service_js_1.VacancyService],
        exports: [vacancy_service_js_1.VacancyService],
    })
], VacancyModule);
//# sourceMappingURL=vacancy.module.js.map