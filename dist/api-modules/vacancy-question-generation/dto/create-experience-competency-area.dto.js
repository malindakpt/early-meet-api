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
exports.CreateExperienceCompetencyAreaDto = exports.CreateExperienceCompetencyQuestionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateExperienceCompetencyQuestionDto {
    questionText;
}
exports.CreateExperienceCompetencyQuestionDto = CreateExperienceCompetencyQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1_000),
    __metadata("design:type", String)
], CreateExperienceCompetencyQuestionDto.prototype, "questionText", void 0);
class CreateExperienceCompetencyAreaDto {
    name;
    importance;
    reason;
    whatToEstablish;
    questions;
}
exports.CreateExperienceCompetencyAreaDto = CreateExperienceCompetencyAreaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateExperienceCompetencyAreaDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AssessmentAreaImportance),
    __metadata("design:type", String)
], CreateExperienceCompetencyAreaDto.prototype, "importance", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateExperienceCompetencyAreaDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(6),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(300, { each: true }),
    __metadata("design:type", Array)
], CreateExperienceCompetencyAreaDto.prototype, "whatToEstablish", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(6),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateExperienceCompetencyQuestionDto),
    __metadata("design:type", Array)
], CreateExperienceCompetencyAreaDto.prototype, "questions", void 0);
//# sourceMappingURL=create-experience-competency-area.dto.js.map