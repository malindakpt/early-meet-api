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
exports.CandidateVacancyAiMatchController = exports.CandidateVacancyMatchingController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const candidate_vacancy_matching_service_js_1 = require("./candidate-vacancy-matching.service.js");
const request_ai_match_dto_js_1 = require("./dto/request-ai-match.dto.js");
let CandidateVacancyMatchingController = class CandidateVacancyMatchingController {
    matchingService;
    constructor(matchingService) {
        this.matchingService = matchingService;
    }
    async match(user, vacancyId, vacancyCandidateId) {
        return this.matchingService.match(user, vacancyId, vacancyCandidateId);
    }
};
exports.CandidateVacancyMatchingController = CandidateVacancyMatchingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CandidateVacancyMatchingController.prototype, "match", null);
exports.CandidateVacancyMatchingController = CandidateVacancyMatchingController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/candidates/:vacancyCandidateId/match'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [candidate_vacancy_matching_service_js_1.CandidateVacancyMatchingService])
], CandidateVacancyMatchingController);
let CandidateVacancyAiMatchController = class CandidateVacancyAiMatchController {
    matchingService;
    constructor(matchingService) {
        this.matchingService = matchingService;
    }
    async requestAiMatch(user, vacancyId, dto) {
        return this.matchingService.requestAiMatches(user, vacancyId, dto.candidateIds);
    }
};
exports.CandidateVacancyAiMatchController = CandidateVacancyAiMatchController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(202),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, request_ai_match_dto_js_1.RequestAiMatchDto]),
    __metadata("design:returntype", Promise)
], CandidateVacancyAiMatchController.prototype, "requestAiMatch", null);
exports.CandidateVacancyAiMatchController = CandidateVacancyAiMatchController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/candidates/ai-match'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [candidate_vacancy_matching_service_js_1.CandidateVacancyMatchingService])
], CandidateVacancyAiMatchController);
//# sourceMappingURL=candidate-vacancy-matching.controller.js.map