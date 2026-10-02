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
exports.SaveExperienceCompetencyConfigurationDto = exports.SaveExperienceCompetencyAreaDto = exports.SaveExperienceCompetencyQuestionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class SaveExperienceCompetencyQuestionDto {
    questionText;
}
exports.SaveExperienceCompetencyQuestionDto = SaveExperienceCompetencyQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1_000),
    __metadata("design:type", String)
], SaveExperienceCompetencyQuestionDto.prototype, "questionText", void 0);
class SaveExperienceCompetencyAreaDto {
    name;
    importance;
    questions;
}
exports.SaveExperienceCompetencyAreaDto = SaveExperienceCompetencyAreaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SaveExperienceCompetencyAreaDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AssessmentAreaImportance),
    __metadata("design:type", String)
], SaveExperienceCompetencyAreaDto.prototype, "importance", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaveExperienceCompetencyQuestionDto),
    __metadata("design:type", Array)
], SaveExperienceCompetencyAreaDto.prototype, "questions", void 0);
class SaveExperienceCompetencyConfigurationDto {
    areas;
}
exports.SaveExperienceCompetencyConfigurationDto = SaveExperienceCompetencyConfigurationDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaveExperienceCompetencyAreaDto),
    __metadata("design:type", Array)
], SaveExperienceCompetencyConfigurationDto.prototype, "areas", void 0);
//# sourceMappingURL=save-experience-competency-configuration.dto.js.map