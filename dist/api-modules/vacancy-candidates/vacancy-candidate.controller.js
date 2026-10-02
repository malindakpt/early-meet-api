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
exports.VacancyCandidateController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const create_vacancy_candidate_dto_js_1 = require("./dto/create-vacancy-candidate.dto.js");
const candidate_ranking_query_dto_js_1 = require("./dto/candidate-ranking-query.dto.js");
const upload_candidate_cvs_dto_js_1 = require("./dto/upload-candidate-cvs.dto.js");
const update_vacancy_candidate_dto_js_1 = require("./dto/update-vacancy-candidate.dto.js");
const vacancy_candidate_list_query_dto_js_1 = require("./dto/vacancy-candidate-list-query.dto.js");
const vacancy_candidate_service_js_1 = require("./vacancy-candidate.service.js");
const candidate_ranking_service_js_1 = require("./candidate-ranking.service.js");
let VacancyCandidateController = class VacancyCandidateController {
    candidateRankingService;
    vacancyCandidateService;
    constructor(candidateRankingService, vacancyCandidateService) {
        this.candidateRankingService = candidateRankingService;
        this.vacancyCandidateService = vacancyCandidateService;
    }
    async uploadCvs(user, vacancyId, dto) {
        return this.vacancyCandidateService.uploadCvs(user, vacancyId, dto);
    }
    async retryCvProcessing(user, vacancyId, vacancyCandidateId) {
        return this.vacancyCandidateService.retryCvProcessing(user, vacancyId, vacancyCandidateId);
    }
    async create(user, vacancyId, dto) {
        return this.vacancyCandidateService.create(user, vacancyId, dto);
    }
    async findAll(user, vacancyId, query) {
        return this.vacancyCandidateService.findAll(user, vacancyId, query);
    }
    async findRanking(user, vacancyId, query) {
        return this.candidateRankingService.findAll(user, vacancyId, query);
    }
    async findOne(user, vacancyId, vacancyCandidateId) {
        return this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
    }
    async update(user, vacancyId, vacancyCandidateId, dto) {
        return this.vacancyCandidateService.update(user, vacancyId, vacancyCandidateId, dto);
    }
    async remove(user, vacancyId, vacancyCandidateId) {
        await this.vacancyCandidateService.remove(user, vacancyId, vacancyCandidateId);
    }
};
exports.VacancyCandidateController = VacancyCandidateController;
__decorate([
    (0, common_1.Post)('cv-upload'),
    (0, common_1.HttpCode)(202),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upload_candidate_cvs_dto_js_1.UploadCandidateCvsDto]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "uploadCvs", null);
__decorate([
    (0, common_1.Post)(':id/retry-cv-processing'),
    (0, common_1.HttpCode)(202),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "retryCvProcessing", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_vacancy_candidate_dto_js_1.CreateVacancyCandidateDto]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, vacancy_candidate_list_query_dto_js_1.VacancyCandidateListQueryDto]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ranking'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, candidate_ranking_query_dto_js_1.CandidateRankingQueryDto]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "findRanking", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_vacancy_candidate_dto_js_1.UpdateVacancyCandidateDto]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VacancyCandidateController.prototype, "remove", null);
exports.VacancyCandidateController = VacancyCandidateController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/candidates'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [candidate_ranking_service_js_1.CandidateRankingService,
        vacancy_candidate_service_js_1.VacancyCandidateService])
], VacancyCandidateController);
//# sourceMappingURL=vacancy-candidate.controller.js.map