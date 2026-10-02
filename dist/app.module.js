"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const auth_module_js_1 = require("./api-modules/auth/auth.module.js");
const candidate_module_js_1 = require("./api-modules/candidates/candidate.module.js");
const candidate_vacancy_matching_module_js_1 = require("./api-modules/candidate-matching/candidate-vacancy-matching.module.js");
const health_module_js_1 = require("./api-modules/health/health.module.js");
const interview_module_js_1 = require("./api-modules/interviews/interview.module.js");
const question_module_js_1 = require("./api-modules/questions/question.module.js");
const vacancy_question_generation_module_js_1 = require("./api-modules/vacancy-question-generation/vacancy-question-generation.module.js");
const technology_module_js_1 = require("./api-modules/technologies/technology.module.js");
const technology_segment_module_js_1 = require("./api-modules/technology-segments/technology-segment.module.js");
const vacancy_module_js_1 = require("./api-modules/vacancies/vacancy.module.js");
const vacancy_candidate_module_js_1 = require("./api-modules/vacancy-candidates/vacancy-candidate.module.js");
const vacancy_technology_module_js_1 = require("./api-modules/vacancy-technologies/vacancy-technology.module.js");
const problem_details_filter_js_1 = require("./common/filters/problem-details.filter.js");
const request_id_middleware_js_1 = require("./common/middleware/request-id.middleware.js");
const response_envelope_interceptor_js_1 = require("./common/interceptors/response-envelope.interceptor.js");
const request_logging_interceptor_js_1 = require("./common/interceptors/request-logging.interceptor.js");
const environment_validation_js_1 = require("./infrastructure/config/environment.validation.js");
const structured_logger_service_js_1 = require("./infrastructure/logging/structured-logger.service.js");
const prisma_module_js_1 = require("./infrastructure/prisma/prisma.module.js");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_js_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                validate: environment_validation_js_1.validateEnvironment,
            }),
            prisma_module_js_1.PrismaModule,
            auth_module_js_1.AuthModule,
            candidate_module_js_1.CandidateModule,
            candidate_vacancy_matching_module_js_1.CandidateVacancyMatchingModule,
            health_module_js_1.HealthModule,
            interview_module_js_1.InterviewModule,
            question_module_js_1.QuestionModule,
            vacancy_question_generation_module_js_1.VacancyQuestionGenerationModule,
            technology_module_js_1.TechnologyModule,
            technology_segment_module_js_1.TechnologySegmentModule,
            vacancy_module_js_1.VacancyModule,
            vacancy_candidate_module_js_1.VacancyCandidateModule,
            vacancy_technology_module_js_1.VacancyTechnologyModule,
        ],
        providers: [
            structured_logger_service_js_1.StructuredLogger,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_envelope_interceptor_js_1.ResponseEnvelopeInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: request_logging_interceptor_js_1.RequestLoggingInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: problem_details_filter_js_1.ProblemDetailsFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map