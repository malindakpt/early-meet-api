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
exports.CandidateVacancyEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const candidate_evaluation_types_js_1 = require("../ai/candidate-evaluation.types.js");
const structured_logger_service_js_1 = require("../../infrastructure/logging/structured-logger.service.js");
const vacancy_candidate_service_js_1 = require("../vacancy-candidates/vacancy-candidate.service.js");
const vacancy_technology_service_js_1 = require("../vacancy-technologies/vacancy-technology.service.js");
const vacancy_service_js_1 = require("../vacancies/vacancy.service.js");
const match_score_calculator_service_js_1 = require("./match-score-calculator.service.js");
const technology_matching_service_js_1 = require("./technology-matching.service.js");
// HR-triggered AI CV match. CV upload performs no AI work, so this workflow both extracts the
// candidate's CV data and evaluates it against the vacancy in a single model call.
let CandidateVacancyEvaluationService = class CandidateVacancyEvaluationService {
    evaluationLlmService;
    vacancyCandidateService;
    vacancyService;
    vacancyTechnologyService;
    technologyMatchingService;
    scoreCalculator;
    logger;
    constructor(evaluationLlmService, vacancyCandidateService, vacancyService, vacancyTechnologyService, technologyMatchingService, scoreCalculator, logger) {
        this.evaluationLlmService = evaluationLlmService;
        this.vacancyCandidateService = vacancyCandidateService;
        this.vacancyService = vacancyService;
        this.vacancyTechnologyService = vacancyTechnologyService;
        this.technologyMatchingService = technologyMatchingService;
        this.scoreCalculator = scoreCalculator;
        this.logger = logger;
    }
    claim(vacancyCandidateId) {
        return this.vacancyCandidateService.claimAiMatch(vacancyCandidateId);
    }
    fail(vacancyCandidateId) {
        return this.vacancyCandidateService.failAiMatch(vacancyCandidateId);
    }
    async process(user, vacancyId, vacancyCandidateId) {
        const vacancyCandidate = await this.vacancyCandidateService.findOne(user, vacancyId, vacancyCandidateId);
        const [vacancy, cvText, vacancyTechnologies] = await Promise.all([
            this.vacancyService.findOne(user, vacancyId),
            this.vacancyCandidateService.getCvTextForAiMatch(vacancyCandidateId),
            this.vacancyTechnologyService.findAll(user, vacancyId),
        ]);
        const evaluation = await this.evaluationLlmService.evaluate(this.buildEvaluationInput(vacancy, cvText, vacancyTechnologies));
        // Required/preferred technology coverage keeps the existing deterministic canonical-name
        // rules, applied to the freshly extracted CV data rather than asked of the model.
        const technologies = vacancyTechnologies.map((vacancyTechnology) => ({
            name: vacancyTechnology.technology.name,
            requirementType: vacancyTechnology.requirementType,
        }));
        const technologyMatches = this.technologyMatchingService.matchExtractedCv(evaluation.cv, technologies);
        await this.vacancyCandidateService.completeAiMatch(vacancyCandidateId, {
            extractedData: evaluation.cv,
            gaps: evaluation.missingRequirements,
            preferredTechnologiesMet: technologyMatches.preferredTechnologiesMet,
            requiredTechnologiesMet: technologyMatches.requiredTechnologiesMet,
            score: evaluation.score,
            strengths: evaluation.matchedRequirements,
            summary: evaluation.summary,
            vacancyMatchScore: this.scoreCalculator.calculateForVacancy(technologyMatches, technologies),
        });
        this.logger.log('Candidate vacancy evaluation completed', {
            event: 'candidate_vacancy.evaluation.completed',
            vacancyId,
            vacancyCandidateId,
            candidateId: vacancyCandidate.candidateId,
        });
    }
    buildEvaluationInput(vacancy, cvText, vacancyTechnologies) {
        return {
            cvText,
            vacancy: {
                title: vacancy.title,
                description: vacancy.jobDescription,
                experienceMin: vacancy.experienceMin,
                experienceMax: vacancy.experienceMax,
                employmentType: vacancy.employmentType,
                workType: vacancy.workType,
                technologies: vacancyTechnologies.map((vacancyTechnology) => ({
                    name: vacancyTechnology.technology.name,
                    requirementType: vacancyTechnology.requirementType,
                    segments: vacancyTechnology.segments.map((segment) => segment.name),
                })),
            },
        };
    }
};
exports.CandidateVacancyEvaluationService = CandidateVacancyEvaluationService;
exports.CandidateVacancyEvaluationService = CandidateVacancyEvaluationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(candidate_evaluation_types_js_1.CANDIDATE_EVALUATION_LLM_SERVICE)),
    __metadata("design:paramtypes", [Object, vacancy_candidate_service_js_1.VacancyCandidateService,
        vacancy_service_js_1.VacancyService,
        vacancy_technology_service_js_1.VacancyTechnologyService,
        technology_matching_service_js_1.TechnologyMatchingService,
        match_score_calculator_service_js_1.MatchScoreCalculatorService,
        structured_logger_service_js_1.StructuredLogger])
], CandidateVacancyEvaluationService);
//# sourceMappingURL=candidate-vacancy-evaluation.service.js.map