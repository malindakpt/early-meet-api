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
exports.MatchScoreCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let MatchScoreCalculatorService = class MatchScoreCalculatorService {
    config;
    constructor(config) {
        this.config = config;
    }
    calculateForVacancy(matches, vacancyTechnologies) {
        const totalRequired = vacancyTechnologies.filter((technology) => technology.requirementType === 'REQUIRED').length;
        return this.calculate(matches.requiredTechnologiesMet.length, totalRequired, matches.preferredTechnologiesMet.length, vacancyTechnologies.length - totalRequired);
    }
    calculate(matchedRequired, totalRequired, matchedPreferred, totalPreferred) {
        const requiredWeight = totalRequired > 0 ? this.config.getOrThrow('MATCH_REQUIRED_TECHNOLOGY_WEIGHT') : 0;
        const preferredWeight = totalPreferred > 0 ? this.config.getOrThrow('MATCH_PREFERRED_TECHNOLOGY_WEIGHT') : 0;
        const totalWeight = requiredWeight + preferredWeight;
        if (totalWeight === 0) {
            return 0;
        }
        const requiredCoverage = totalRequired === 0 ? 0 : matchedRequired / totalRequired;
        const preferredCoverage = totalPreferred === 0 ? 0 : matchedPreferred / totalPreferred;
        const score = ((requiredCoverage * requiredWeight + preferredCoverage * preferredWeight) / totalWeight) *
            100;
        return Number(score.toFixed(2));
    }
};
exports.MatchScoreCalculatorService = MatchScoreCalculatorService;
exports.MatchScoreCalculatorService = MatchScoreCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MatchScoreCalculatorService);
//# sourceMappingURL=match-score-calculator.service.js.map