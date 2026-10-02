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
exports.VacancyAssessmentSuggestionScheduler = void 0;
const common_1 = require("@nestjs/common");
const configuration_values_js_1 = require("../../infrastructure/config/configuration-values.js");
const vacancy_assessment_suggestion_service_js_1 = require("./vacancy-assessment-suggestion.service.js");
let VacancyAssessmentSuggestionScheduler = class VacancyAssessmentSuggestionScheduler {
    suggestionService;
    activeCount = 0;
    queuedGenerationIds = [];
    constructor(suggestionService) {
        this.suggestionService = suggestionService;
    }
    schedule(generationId) {
        if (this.queuedGenerationIds.includes(generationId))
            return;
        this.queuedGenerationIds.push(generationId);
        this.startNext();
    }
    startNext() {
        while (this.activeCount < configuration_values_js_1.configurationValues.assessmentAreaGeneration.maxConcurrentGenerations &&
            this.queuedGenerationIds.length > 0) {
            const generationId = this.queuedGenerationIds.shift();
            if (generationId === undefined)
                return;
            this.activeCount += 1;
            setImmediate(() => {
                void this.suggestionService.process(generationId).finally(() => {
                    this.activeCount -= 1;
                    this.startNext();
                });
            });
        }
    }
};
exports.VacancyAssessmentSuggestionScheduler = VacancyAssessmentSuggestionScheduler;
exports.VacancyAssessmentSuggestionScheduler = VacancyAssessmentSuggestionScheduler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vacancy_assessment_suggestion_service_js_1.VacancyAssessmentSuggestionService])
], VacancyAssessmentSuggestionScheduler);
//# sourceMappingURL=vacancy-assessment-suggestion-scheduler.service.js.map