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
exports.InterviewController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const update_interview_invitation_dto_js_1 = require("./dto/update-interview-invitation.dto.js");
const submit_interview_answer_dto_js_1 = require("./dto/submit-interview-answer.dto.js");
const interview_answer_evaluation_service_js_1 = require("./interview-answer-evaluation.service.js");
const interview_follow_up_service_js_1 = require("./interview-follow-up.service.js");
const interview_overall_evaluation_service_js_1 = require("./interview-overall-evaluation.service.js");
const interview_service_js_1 = require("./interview.service.js");
let InterviewController = class InterviewController {
    interviewService;
    interviewAnswerEvaluationService;
    interviewFollowUpService;
    interviewOverallEvaluationService;
    constructor(interviewService, interviewAnswerEvaluationService, interviewFollowUpService, interviewOverallEvaluationService) {
        this.interviewService = interviewService;
        this.interviewAnswerEvaluationService = interviewAnswerEvaluationService;
        this.interviewFollowUpService = interviewFollowUpService;
        this.interviewOverallEvaluationService = interviewOverallEvaluationService;
    }
    async create(user, vacancyId, vacancyCandidateId) {
        return this.interviewService.sendInvitation(user, vacancyId, vacancyCandidateId);
    }
    async findAll(user, vacancyId, vacancyCandidateId) {
        return this.interviewService.findAll(user, vacancyId, vacancyCandidateId);
    }
    async findOne(user, vacancyId, vacancyCandidateId, interviewId) {
        return this.interviewService.findOne(user, vacancyId, vacancyCandidateId, interviewId);
    }
    async update(user, vacancyId, vacancyCandidateId, interviewId, dto) {
        return this.interviewService.update(user, vacancyId, vacancyCandidateId, interviewId, dto);
    }
    async start(user, vacancyId, vacancyCandidateId, interviewId) {
        return this.interviewService.start(user, vacancyId, vacancyCandidateId, interviewId);
    }
    async getProgress(user, vacancyId, vacancyCandidateId, interviewId) {
        return this.interviewService.getProgress(user, vacancyId, vacancyCandidateId, interviewId);
    }
    async submitAnswer(user, vacancyId, vacancyCandidateId, interviewId, dto) {
        return this.interviewService.submitAnswer(user, vacancyId, vacancyCandidateId, interviewId, dto);
    }
    async evaluateAnswer(user, vacancyId, vacancyCandidateId, interviewId, answerId) {
        return this.interviewAnswerEvaluationService.evaluate(user, vacancyId, vacancyCandidateId, interviewId, answerId);
    }
    async decideFollowUp(user, vacancyId, vacancyCandidateId, interviewId, answerId) {
        return this.interviewFollowUpService.decide(user, vacancyId, vacancyCandidateId, interviewId, answerId);
    }
    async evaluateOverall(user, vacancyId, vacancyCandidateId, interviewId) {
        return this.interviewOverallEvaluationService.evaluate(user, vacancyId, vacancyCandidateId, interviewId);
    }
    async findOverallEvaluation(user, vacancyId, vacancyCandidateId, interviewId) {
        return this.interviewOverallEvaluationService.findOne(user, vacancyId, vacancyCandidateId, interviewId);
    }
};
exports.InterviewController = InterviewController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, update_interview_invitation_dto_js_1.UpdateInterviewInvitationDto]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "start", null);
__decorate([
    (0, common_1.Get)(':id/progress'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Post)(':id/answers'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, submit_interview_answer_dto_js_1.SubmitInterviewAnswerDto]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Post)(':id/answers/:answerId/evaluate'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __param(4, (0, common_1.Param)('answerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "evaluateAnswer", null);
__decorate([
    (0, common_1.Post)(':id/answers/:answerId/follow-up'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __param(4, (0, common_1.Param)('answerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "decideFollowUp", null);
__decorate([
    (0, common_1.Post)(':id/evaluate'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "evaluateOverall", null);
__decorate([
    (0, common_1.Get)(':id/evaluation'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vacancyId')),
    __param(2, (0, common_1.Param)('vacancyCandidateId')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], InterviewController.prototype, "findOverallEvaluation", null);
exports.InterviewController = InterviewController = __decorate([
    (0, common_1.Controller)('vacancies/:vacancyId/candidates/:vacancyCandidateId/interviews'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [interview_service_js_1.InterviewService,
        interview_answer_evaluation_service_js_1.InterviewAnswerEvaluationService,
        interview_follow_up_service_js_1.InterviewFollowUpService,
        interview_overall_evaluation_service_js_1.InterviewOverallEvaluationService])
], InterviewController);
//# sourceMappingURL=interview.controller.js.map