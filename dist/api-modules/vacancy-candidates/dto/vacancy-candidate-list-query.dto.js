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
exports.VacancyCandidateListQueryDto = exports.SortDirection = exports.VacancyCandidateSortBy = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
var VacancyCandidateSortBy;
(function (VacancyCandidateSortBy) {
    VacancyCandidateSortBy["AI_INTERVIEW_SCORE"] = "aiInterviewScore";
    VacancyCandidateSortBy["AI_MATCH_SCORE"] = "aiMatchScore";
    VacancyCandidateSortBy["CREATED_AT"] = "createdAt";
    VacancyCandidateSortBy["KEYWORD_MATCH_SCORE"] = "keywordMatchScore";
    VacancyCandidateSortBy["MATCH_SCORE"] = "matchScore";
    VacancyCandidateSortBy["UPDATED_AT"] = "updatedAt";
})(VacancyCandidateSortBy || (exports.VacancyCandidateSortBy = VacancyCandidateSortBy = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "asc";
    SortDirection["DESC"] = "desc";
})(SortDirection || (exports.SortDirection = SortDirection = {}));
class VacancyCandidateListQueryDto {
    status;
    processingStatus;
    decision;
    minMatchScore;
    maxMatchScore;
    sortBy;
    sortDirection;
    page;
    limit;
}
exports.VacancyCandidateListQueryDto = VacancyCandidateListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CandidateStatus),
    __metadata("design:type", String)
], VacancyCandidateListQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CandidateProcessingStatus),
    __metadata("design:type", String)
], VacancyCandidateListQueryDto.prototype, "processingStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CandidateDecision),
    __metadata("design:type", String)
], VacancyCandidateListQueryDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], VacancyCandidateListQueryDto.prototype, "minMatchScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], VacancyCandidateListQueryDto.prototype, "maxMatchScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(VacancyCandidateSortBy),
    __metadata("design:type", String)
], VacancyCandidateListQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortDirection),
    __metadata("design:type", String)
], VacancyCandidateListQueryDto.prototype, "sortDirection", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], VacancyCandidateListQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], VacancyCandidateListQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=vacancy-candidate-list-query.dto.js.map