"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_js_1 = require("../auth/auth.module.js");
const technology_segment_module_js_1 = require("../technology-segments/technology-segment.module.js");
const technology_module_js_1 = require("../technologies/technology.module.js");
const question_controller_js_1 = require("./question.controller.js");
const question_service_js_1 = require("./question.service.js");
let QuestionModule = class QuestionModule {
};
exports.QuestionModule = QuestionModule;
exports.QuestionModule = QuestionModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_js_1.AuthModule, technology_module_js_1.TechnologyModule, technology_segment_module_js_1.TechnologySegmentModule],
        controllers: [question_controller_js_1.QuestionController],
        providers: [question_service_js_1.QuestionService],
        exports: [question_service_js_1.QuestionService],
    })
], QuestionModule);
//# sourceMappingURL=question.module.js.map