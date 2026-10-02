"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnologyMatchingService = void 0;
const common_1 = require("@nestjs/common");
let TechnologyMatchingService = class TechnologyMatchingService {
    // Matches the technologies named in extracted CV skills and work experience.
    matchExtractedCv(extractedData, vacancyTechnologies) {
        return this.match([
            ...extractedData.skills.map((skill) => skill.name),
            ...extractedData.workExperience.flatMap((experience) => experience.technologies),
        ], vacancyTechnologies);
    }
    match(candidateSkillNames, vacancyTechnologies) {
        const candidateTechnologies = new Set(candidateSkillNames.map((name) => name.trim().toLocaleLowerCase()).filter(Boolean));
        const requiredTechnologiesMet = [];
        const preferredTechnologiesMet = [];
        for (const technology of vacancyTechnologies) {
            if (!candidateTechnologies.has(technology.name.trim().toLocaleLowerCase())) {
                continue;
            }
            if (technology.requirementType === 'REQUIRED') {
                requiredTechnologiesMet.push(technology.name);
            }
            else {
                preferredTechnologiesMet.push(technology.name);
            }
        }
        return { requiredTechnologiesMet, preferredTechnologiesMet };
    }
};
exports.TechnologyMatchingService = TechnologyMatchingService;
exports.TechnologyMatchingService = TechnologyMatchingService = __decorate([
    (0, common_1.Injectable)()
], TechnologyMatchingService);
//# sourceMappingURL=technology-matching.service.js.map