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
exports.PublicApplicationController = void 0;
const common_1 = require("@nestjs/common");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const submit_public_application_dto_js_1 = require("./dto/submit-public-application.dto.js");
const vacancy_candidate_service_js_1 = require("./vacancy-candidate.service.js");
// Unauthenticated: the unguessable per-vacancy token is the only credential.
let PublicApplicationController = class PublicApplicationController {
    vacancyCandidateService;
    vacancyService;
    constructor(vacancyCandidateService, vacancyService) {
        this.vacancyCandidateService = vacancyCandidateService;
        this.vacancyService = vacancyService;
    }
    async findOne(params) {
        return this.vacancyService.findPublicApplication(params.token);
    }
    async submit(params, dto) {
        await this.vacancyCandidateService.submitPublicApplication(params.token, dto);
        return { message: 'Your CV has been submitted successfully.' };
    }
};
exports.PublicApplicationController = PublicApplicationController;
__decorate([
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_public_application_dto_js_1.PublicApplicationTokenParamsDto]),
    __metadata("design:returntype", Promise)
], PublicApplicationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':token/submit'),
    (0, common_1.HttpCode)(202),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_public_application_dto_js_1.PublicApplicationTokenParamsDto,
        submit_public_application_dto_js_1.SubmitPublicApplicationDto]),
    __metadata("design:returntype", Promise)
], PublicApplicationController.prototype, "submit", null);
exports.PublicApplicationController = PublicApplicationController = __decorate([
    (0, common_1.Controller)('public/applications'),
    __metadata("design:paramtypes", [vacancy_candidate_service_js_1.VacancyCandidateService,
        vacancy_service_js_1.VacancyService])
], PublicApplicationController);
//# sourceMappingURL=public-application.controller.js.map