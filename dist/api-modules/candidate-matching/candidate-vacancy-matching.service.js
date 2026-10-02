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
exports.CandidateVacancyMatchingService = void 0;
const common_1 = require("@nestjs/common");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const vacancy_candidate_service_js_1 = require("../vacancy-candidates/vacancy-candidate.service.js");
const vacancy_technology_service_js_1 = require("../vacancy-technologies/vacancy-technology.service.js");
const candidate_vacancy_evaluation_scheduler_service_js_1 = require("./candidate-vacancy-evaluation-scheduler.service.js");
const match_score_calculator_service_js_1 = require("./match-score-calculator.service.js");
const technology_matching_service_js_1 = require("./technology-matching.service.js");
let CandidateVacancyMatchingService = class CandidateVacancyMatchingService {
    vacancyCandidateService;
    vacancyTechnologyService;
    technologyMatchingService;
    scoreCalculator;
    evaluationScheduler;
    logger;
    constructor(vacancyCandidateService, vacancyTechnologyService, technologyMatchingService, scoreCalculator, evaluationScheduler, logger) {
        this.vacancyCandidateService = vacancyCandidateService;
        this.vacancyTechnologyService = vacancyTechnologyService;
        this.technologyMatchingService = technologyMatchingService;
        this.scoreCalculator = scoreCalculator;
        this.evaluationScheduler = evaluationScheduler;
        this.logger = logger;
    }
    async match(user, vacancyId, vacancyCandidateId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const extractedData = await this.vacancyCandidateService.getPersistedCvExtractedData(vacancyCandidateId);
        const vacancyTechnologies = await this.vacancyTechnologyService.findAll(user, vacancyId);
        const technologies = vacancyTechnologies.map((vacancyTechnology) => ({
            name: vacancyTechnology.technology.name,
            requirementType: vacancyTechnology.requirementType,
        }));
        const matches = this.technologyMatchingService.matchExtractedCv(extractedData, technologies);
        const score = this.scoreCalculator.calculateForVacancy(matches, technologies);
        const result = await this.vacancyCandidateService.update(user, vacancyId, vacancyCandidateId, {
            vacancyMatchScore: score,
            requiredTechnologiesMet: matches.requiredTechnologiesMet,
            preferredTechnologiesMet: matches.preferredTechnologiesMet,
        });
        this.logger.log('Candidate vacancy matching completed', {
            event: 'candidate_vacancy.matching.completed',
            vacancyId,
            vacancyCandidateId,
            candidateId: vacancyCandidate.candidateId,
            score,
        });
        return result;
    }
    async requestAiMatches(user, vacancyId, vacancyCandidateIds) {
        const queuedCandidateIds = await this.vacancyCandidateService.queueAiMatches(user, vacancyId, vacancyCandidateIds);
        for (const vacancyCandidateId of queuedCandidateIds) {
            this.evaluationScheduler.schedule(user, vacancyId, vacancyCandidateId);
        }
        return { queuedCandidateIds };
    }
};
exports.CandidateVacancyMatchingService = CandidateVacancyMatchingService;
exports.CandidateVacancyMatchingService = CandidateVacancyMatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vacancy_candidate_service_js_1.VacancyCandidateService,
        vacancy_technology_service_js_1.VacancyTechnologyService,
        technology_matching_service_js_1.TechnologyMatchingService,
        match_score_calculator_service_js_1.MatchScoreCalculatorService,
        candidate_vacancy_evaluation_scheduler_service_js_1.CandidateVacancyEvaluationScheduler,
        structured_logger_service_js_1.StructuredLogger])
], CandidateVacancyMatchingService);
//# sourceMappingURL=candidate-vacancy-matching.service.js.map