// Server-side port of the Vacancy MFE's keyword matcher
// (apps/vacancy-mfe/src/modules/candidates/cv/candidate-keyword-match.ts). Public applications
// are unauthenticated, so their keyword score must be computed here rather than trusted from
// the browser. Keep both implementations in sync so HR and public uploads score identically.

export interface IKeywordMatchTechnology {
  requirementType: 'PREFERRED' | 'REQUIRED';
  segments: Array<{ name: string }>;
  technology: { name: string };
}

export interface IKeywordMatchResult {
  matchedSegments: string[];
  matchedTechnologies: string[];
  preferredMatched: number;
  preferredTotal: number;
  requiredMatched: number;
  requiredTotal: number;
  score: number;
}

const technologyAliases: Record<string, string[]> = {
  nodejs: ['node', 'node.js'],
  postgresql: ['postgres', 'postgresql'],
  reactjs: ['react', 'react.js', 'reactjs'],
};

export function calculateKeywordMatch(
  cvText: string,
  vacancyTechnologies: IKeywordMatchTechnology[],
): IKeywordMatchResult {
  const normalizedCvText = normalizeText(cvText);
  const required = vacancyTechnologies.filter(
    (technology) => technology.requirementType === 'REQUIRED',
  );
  const preferred = vacancyTechnologies.filter(
    (technology) => technology.requirementType === 'PREFERRED',
  );
  const selectedSegments = vacancyTechnologies.flatMap((technology) => technology.segments);
  const matchedTechnologies = vacancyTechnologies
    .filter((technology) => textContainsTechnology(normalizedCvText, technology.technology.name))
    .map((technology) => technology.technology.name);
  const matchedTechnologyNames = new Set(matchedTechnologies);
  const matchedSegments = selectedSegments
    .filter((segment) => textContainsPhrase(normalizedCvText, segment.name))
    .map((segment) => segment.name);
  const requiredMatched = required.filter((technology) =>
    matchedTechnologyNames.has(technology.technology.name),
  ).length;
  const preferredMatched = preferred.filter((technology) =>
    matchedTechnologyNames.has(technology.technology.name),
  ).length;
  const score = calculateWeightedScore({
    preferredMatched,
    preferredTotal: preferred.length,
    requiredMatched,
    requiredTotal: required.length,
    segmentMatched: matchedSegments.length,
    segmentTotal: selectedSegments.length,
  });

  return {
    matchedSegments,
    matchedTechnologies,
    preferredMatched,
    preferredTotal: preferred.length,
    requiredMatched,
    requiredTotal: required.length,
    score,
  };
}

function calculateWeightedScore(input: {
  preferredMatched: number;
  preferredTotal: number;
  requiredMatched: number;
  requiredTotal: number;
  segmentMatched: number;
  segmentTotal: number;
}): number {
  const components = [
    { matched: input.requiredMatched, total: input.requiredTotal, weight: 70 },
    { matched: input.preferredMatched, total: input.preferredTotal, weight: 20 },
    { matched: input.segmentMatched, total: input.segmentTotal, weight: 10 },
  ].filter((component) => component.total > 0);
  if (components.length === 0) return 0;
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  const score = components.reduce(
    (sum, component) => sum + (component.matched / component.total) * component.weight,
    0,
  );
  return Number(((score / totalWeight) * 100).toFixed(2));
}

function textContainsTechnology(normalizedCvText: string, technologyName: string): boolean {
  const normalizedTechnology = normalizeText(technologyName).replaceAll(' ', '');
  const aliases = technologyAliases[normalizedTechnology] ?? [technologyName];
  return aliases.some((alias) => textContainsPhrase(normalizedCvText, alias));
}

function textContainsPhrase(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  return normalizedPhrase.length > 0 && normalizedText.includes(normalizedPhrase);
}

function normalizeText(value: string): string {
  return ` ${value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}
