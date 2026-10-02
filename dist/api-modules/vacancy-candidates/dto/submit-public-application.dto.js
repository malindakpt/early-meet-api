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
exports.SubmitPublicApplicationDto = exports.PublicApplicationTokenParamsDto = void 0;
const class_validator_1 = require("class-validator");
const upload_candidate_cvs_dto_js_1 = require("./upload-candidate-cvs.dto.js");
class PublicApplicationTokenParamsDto {
    token;
}
exports.PublicApplicationTokenParamsDto = PublicApplicationTokenParamsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-f0-9]{64}$/),
    __metadata("design:type", String)
], PublicApplicationTokenParamsDto.prototype, "token", void 0);
// A single applicant CV. Unlike the HR upload, no keyword score is accepted from the client;
// it is computed server-side.
class SubmitPublicApplicationDto {
    email;
    fileName;
    extractedText;
}
exports.SubmitPublicApplicationDto = SubmitPublicApplicationDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SubmitPublicApplicationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    (0, class_validator_1.Matches)(/\.pdf$/i, { message: 'Upload your CV as a PDF file.' }),
    __metadata("design:type", String)
], SubmitPublicApplicationDto.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(upload_candidate_cvs_dto_js_1.CANDIDATE_CV_MAX_EXTRACTED_TEXT_LENGTH),
    (0, class_validator_1.Matches)(/\S/),
    __metadata("design:type", String)
], SubmitPublicApplicationDto.prototype, "extractedText", void 0);
//# sourceMappingURL=submit-public-application.dto.js.map