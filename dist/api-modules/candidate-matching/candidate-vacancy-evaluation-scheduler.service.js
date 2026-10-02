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
exports.CandidateVacancyEvaluationScheduler = void 0;
const common_1 = require("@nestjs/common");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const error_serializer_js_1 = require("../../infrastructure/logging/error-serializer.js");
const candidate_vacancy_evaluation_service_js_1 = require("./candidate-vacancy-evaluation.service.js");
let CandidateVacancyEvaluationScheduler = class CandidateVacancyEvaluationScheduler {
    evaluationService;
    logger;
    scheduledCandidateIds = new Set();
    constructor(evaluationService, logger) {
        this.evaluationService = evaluationService;
        this.logger = logger;
    }
    schedule(user, vacancyId, vacancyCandidateId) {
        if (this.scheduledCandidateIds.has(vacancyCandidateId)) {
            return;
        }
        this.scheduledCandidateIds.add(vacancyCandidateId);
        setImmediate(() => {
            void this.process(user, vacancyId, vacancyCandidateId);
        });
    }
    async process(user, vacancyId, vacancyCandidateId) {
        try {
            if (!(await this.evaluationService.claim(vacancyCandidateId)))
                return;
            await this.evaluationService.process(user, vacancyId, vacancyCandidateId);
        }
        catch (error) {
            await this.evaluationService.fail(vacancyCandidateId);
            this.logger.error('Candidate vacancy evaluation failed', {
                event: 'candidate_vacancy.evaluation.failed',
                vacancyId,
                vacancyCandidateId,
                error: (0, error_serializer_js_1.serializeError)(error),
            });
        }
        finally {
            this.scheduledCandidateIds.delete(vacancyCandidateId);
        }
    }
};
exports.CandidateVacancyEvaluationScheduler = CandidateVacancyEvaluationScheduler;
exports.CandidateVacancyEvaluationScheduler = CandidateVacancyEvaluationScheduler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [candidate_vacancy_evaluation_service_js_1.CandidateVacancyEvaluationService,
        structured_logger_service_js_1.StructuredLogger])
], CandidateVacancyEvaluationScheduler);
//# sourceMappingURL=candidate-vacancy-evaluation-scheduler.service.js.map