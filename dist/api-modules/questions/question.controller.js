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
exports.QuestionController = void 0;
const common_1 = require("@nestjs/common");
const authentication_guard_js_1 = require("../auth/guards/authentication.guard.js");
const platform_admin_guard_js_1 = require("../auth/guards/platform-admin.guard.js");
const auth_service_js_1 = require("../auth/auth.service.js");
const current_user_decorator_js_1 = require("../auth/decorators/current-user.decorator.js");
const create_question_dto_js_1 = require("./dto/create-question.dto.js");
const question_csv_import_dto_js_1 = require("./dto/question-csv-import.dto.js");
const query_questions_dto_js_1 = require("./dto/query-questions.dto.js");
const update_question_dto_js_1 = require("./dto/update-question.dto.js");
const question_service_js_1 = require("./question.service.js");
let QuestionController = class QuestionController {
    questionService;
    authService;
    constructor(questionService, authService) {
        this.questionService = questionService;
        this.authService = authService;
    }
    async create(user, dto) {
        return this.questionService.create(user, dto);
    }
    async previewImport(dto) {
        return this.questionService.previewCsvImport(dto.csv);
    }
    async import(dto, user) {
        await this.authService.verifyCurrentPassword(user.id, dto.password);
        return this.questionService.importCsv(user, dto.csv);
    }
    async findAll(user, query) {
        return this.questionService.findAll(user, query);
    }
    async findOne(questionId) {
        return this.questionService.findOne(questionId);
    }
    async update(questionId, dto) {
        return this.questionService.update(questionId, dto);
    }
    async approve(questionId) {
        return this.questionService.approve(questionId);
    }
    async archive(questionId) {
        return this.questionService.archive(questionId);
    }
};
exports.QuestionController = QuestionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_question_dto_js_1.CreateQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import/preview'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_csv_import_dto_js_1.QuestionCsvPreviewDto]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "previewImport", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_csv_import_dto_js_1.QuestionCsvImportDto, Object]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "import", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_questions_dto_js_1.QueryQuestionsDto]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_question_dto_js_1.UpdateQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    (0, common_1.UseGuards)(platform_admin_guard_js_1.PlatformAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "archive", null);
exports.QuestionController = QuestionController = __decorate([
    (0, common_1.Controller)('questions'),
    (0, common_1.UseGuards)(authentication_guard_js_1.AuthenticationGuard),
    __metadata("design:paramtypes", [question_service_js_1.QuestionService,
        auth_service_js_1.AuthService])
], QuestionController);
//# sourceMappingURL=question.controller.js.map