import { Injectable } from '@nestjs/common';

import type { IExtractedCvData } from '../ai/cv-extraction.types.js';

export interface ITechnologyMatchResult {
  preferredTechnologiesMet: string[];
  requiredTechnologiesMet: string[];
}

export interface IVacancyTechnologyForMatching {
  name: string;
  requirementType: 'PREFERRED' | 'REQUIRED';
}

@Injectable()
export class TechnologyMatchingService {
  // Matches the technologies named in extracted CV skills and work experience.
  matchExtractedCv(
    extractedData: IExtractedCvData,
    vacancyTechnologies: IVacancyTechnologyForMatching[],
  ): ITechnologyMatchResult {
    return this.match(
      [
        ...extractedData.skills.map((skill) => skill.name),
        ...extractedData.workExperience.flatMap((experience) => experience.technologies),
      ],
      vacancyTechnologies,
    );
  }

  match(
    candidateSkillNames: string[],
    vacancyTechnologies: IVacancyTechnologyForMatching[],
  ): ITechnologyMatchResult {
    const candidateTechnologies = new Set(
      candidateSkillNames.map((name) => name.trim().toLocaleLowerCase()).filter(Boolean),
    );
    const requiredTechnologiesMet: string[] = [];
    const preferredTechnologiesMet: string[] = [];

    for (const technology of vacancyTechnologies) {
      if (!candidateTechnologies.has(technology.name.trim().toLocaleLowerCase())) {
        continue;
      }
      if (technology.requirementType === 'REQUIRED') {
        requiredTechnologiesMet.push(technology.name);
      } else {
        preferredTechnologiesMet.push(technology.name);
      }
    }

    return { requiredTechnologiesMet, preferredTechnologiesMet };
  }
}
