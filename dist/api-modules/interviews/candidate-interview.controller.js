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
exports.CandidateInterviewController = void 0;
const common_1 = require("@nestjs/common");
const candidate_interview_token_params_dto_js_1 = require("./dto/candidate-interview-token-params.dto.js");
const submit_interview_answer_dto_js_1 = require("./dto/submit-interview-answer.dto.js");
const interview_service_js_1 = require("./interview.service.js");
let CandidateInterviewController = class CandidateInterviewController {
    interviewService;
    constructor(interviewService) {
        this.interviewService = interviewService;
    }
    async getProgress(params) {
        return this.interviewService.getCandidateProgress(params.token);
    }
    async start(params) {
        return this.interviewService.startCandidateInterview(params.token);
    }
    async submitAnswer(params, dto) {
        return this.interviewService.submitCandidateAnswer(params.token, dto);
    }
};
exports.CandidateInterviewController = CandidateInterviewController;
__decorate([
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [candidate_interview_token_params_dto_js_1.CandidateInterviewTokenParamsDto]),
    __metadata("design:returntype", Promise)
], CandidateInterviewController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Post)(':token/start'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [candidate_interview_token_params_dto_js_1.CandidateInterviewTokenParamsDto]),
    __metadata("design:returntype", Promise)
], CandidateInterviewController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':token/answers'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [candidate_interview_token_params_dto_js_1.CandidateInterviewTokenParamsDto,
        submit_interview_answer_dto_js_1.SubmitInterviewAnswerDto]),
    __metadata("design:returntype", Promise)
], CandidateInterviewController.prototype, "submitAnswer", null);
exports.CandidateInterviewController = CandidateInterviewController = __decorate([
    (0, common_1.Controller)('candidate-interviews'),
    __metadata("design:paramtypes", [interview_service_js_1.InterviewService])
], CandidateInterviewController);
//# sourceMappingURL=candidate-interview.controller.js.map