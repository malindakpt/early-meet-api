import assert from 'node:assert/strict';
import test from 'node:test';

import { CandidateVacancyMatchingService } from '../dist/api-modules/candidate-matching/candidate-vacancy-matching.service.js';
import { MatchScoreCalculatorService } from '../dist/api-modules/candidate-matching/match-score-calculator.service.js';
import { TechnologyMatchingService } from '../dist/api-modules/candidate-matching/technology-matching.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function extractedData(skillNames = [], workTechnologyNames = []) {
  return {
    candidate: {
      fullName: null,
      email: null,
      phone: null,
      location: null,
      linkedInUrl: null,
      portfolioUrl: null,
    },
    summary: null,
    skills: skillNames.map((name) => ({ name, category: null, yearsOfExperience: null })),
    workExperience: workTechnologyNames.length === 0 ? [] : [{ technologies: workTechnologyNames }],
    education: [],
    certifications: [],
  };
}

function createFixture({
  candidateSkills = ['TypeScript', 'React'],
  candidateWorkTechnologies = [],
  cvError,
  technologies,
} = {}) {
  const state = {
    cvCalls: 0,
    matchingUpdates: [],
    scheduledEvaluations: [],
    logs: [],
    technologies: technologies ?? [
      { technology: { name: 'TypeScript' }, requirementType: 'REQUIRED' },
      { technology: { name: 'Node.js' }, requirementType: 'REQUIRED' },
      { technology: { name: 'React' }, requirementType: 'PREFERRED' },
      { technology: { name: 'Docker' }, requirementType: 'PREFERRED' },
    ],
  };
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const vacancyCandidate = {
    id: 'vacancy-candidate-1',
    candidateId: 'candidate-1',
    vacancyId: 'vacancy-1',
    candidate: { id: 'candidate-1' },
  };
  const vacancyCandidateService = {
    async findOne(user, vacancyId, vacancyCandidateId) {
      if (
        user.organizationId !== 'organization-1' ||
        vacancyId !== 'vacancy-1' ||
        vacancyCandidateId !== 'vacancy-candidate-1'
      ) {
        throw notFound('Vacancy candidate not found.');
      }
      return vacancyCandidate;
    },
    async update(_user, _vacancyId, _vacancyCandidateId, update) {
      state.matchingUpdates.push(update);
      return { ...vacancyCandidate, ...update };
    },
    async getPersistedCvExtractedData() {
      state.cvCalls += 1;
      if (cvError !== undefined) {
        throw cvError;
      }
      return extractedData(candidateSkills, candidateWorkTechnologies);
    },
    async queueAiMatches(user, vacancyId, vacancyCandidateIds) {
      state.queueRequest = { user, vacancyId, vacancyCandidateIds };
      return vacancyCandidateIds;
    },
  };
  const vacancyTechnologyService = {
    async findAll() {
      return state.technologies;
    },
  };
  const scoreCalculator = new MatchScoreCalculatorService({
    getOrThrow(name) {
      return {
        MATCH_REQUIRED_TECHNOLOGY_WEIGHT: 70,
        MATCH_PREFERRED_TECHNOLOGY_WEIGHT: 30,
      }[name];
    },
  });
  const logger = {
    log(message, context) {
      state.logs.push({ message, context });
    },
  };
  const evaluationScheduler = {
    schedule(user, vacancyId, vacancyCandidateId) {
      state.scheduledEvaluations.push({ user, vacancyId, vacancyCandidateId });
    },
  };
  return {
    service: new CandidateVacancyMatchingService(
      vacancyCandidateService,
      vacancyTechnologyService,
      new TechnologyMatchingService(),
      scoreCalculator,
      evaluationScheduler,
      logger,
    ),
    state,
  };
}

test('matches Candidate-owned CV skills against required and preferred canonical technologies', async () => {
  const { service, state } = createFixture();
  const result = await service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  assert.deepEqual(state.matchingUpdates, [
    {
      vacancyMatchScore: 50,
      requiredTechnologiesMet: ['TypeScript'],
      preferredTechnologiesMet: ['React'],
    },
  ]);
  assert.equal(result.vacancyMatchScore, 50);
  assert.equal(state.cvCalls, 1);
  assert.deepEqual(state.scheduledEvaluations, []);
  assert.equal(state.logs[0].context.candidateId, 'candidate-1');
  assert.equal(JSON.stringify(state.logs).includes('TypeScript'), false);
});

test('uses case-insensitive exact canonical matching without aliases', async () => {
  const { service, state } = createFixture({ candidateSkills: [' typescript ', 'React.js'] });
  await service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  assert.deepEqual(state.matchingUpdates[0].requiredTechnologiesMet, ['TypeScript']);
  assert.deepEqual(state.matchingUpdates[0].preferredTechnologiesMet, []);
  assert.equal(state.matchingUpdates[0].vacancyMatchScore, 35);
});

test('matches technologies found only in extracted work experience', async () => {
  const { service, state } = createFixture({
    candidateSkills: [],
    candidateWorkTechnologies: ['Node.js'],
  });
  await service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  assert.deepEqual(state.matchingUpdates[0].requiredTechnologiesMet, ['Node.js']);
  assert.equal(state.matchingUpdates[0].vacancyMatchScore, 35);
});

test('reallocates available weights for required-only, preferred-only, and empty vacancies', async () => {
  const requiredOnly = createFixture({
    candidateSkills: ['TypeScript'],
    technologies: [
      { technology: { name: 'TypeScript' }, requirementType: 'REQUIRED' },
      { technology: { name: 'Node.js' }, requirementType: 'REQUIRED' },
    ],
  });
  await requiredOnly.service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  assert.equal(requiredOnly.state.matchingUpdates[0].vacancyMatchScore, 50);

  const preferredOnly = createFixture({
    candidateSkills: ['React'],
    technologies: [
      { technology: { name: 'React' }, requirementType: 'PREFERRED' },
      { technology: { name: 'Docker' }, requirementType: 'PREFERRED' },
    ],
  });
  await preferredOnly.service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  assert.equal(preferredOnly.state.matchingUpdates[0].vacancyMatchScore, 50);

  const empty = createFixture({ technologies: [] });
  await empty.service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  assert.deepEqual(empty.state.matchingUpdates[0], {
    vacancyMatchScore: 0,
    requiredTechnologiesMet: [],
    preferredTechnologiesMet: [],
  });
});

test('requires an authorized vacancy candidate with a completed, valid CV', async () => {
  const missingCv = Object.assign(new Error('Candidate CV not found.'), { status: 404 });
  const { service: missingCvService } = createFixture({ cvError: missingCv });
  await assert.rejects(
    missingCvService.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1'),
    { status: 404 },
  );

  const unprocessedCv = Object.assign(new Error('Candidate CV processing has not completed.'), {
    status: 409,
  });
  const { service: unprocessedCvService } = createFixture({ cvError: unprocessedCv });
  await assert.rejects(
    unprocessedCvService.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1'),
    { status: 409 },
  );

  const { service } = createFixture();
  await assert.rejects(service.match(organizationTwoUser, 'vacancy-1', 'vacancy-candidate-1'), {
    status: 404,
  });
  await assert.rejects(service.match(organizationOneUser, 'vacancy-1', 'wrong-candidate'), {
    status: 404,
  });
});

test('recalculation is idempotent for unchanged CV and vacancy technology data', async () => {
  const { service, state } = createFixture();
  await service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  await service.match(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  assert.deepEqual(state.matchingUpdates[0], state.matchingUpdates[1]);
});

test('queues explicit AI match requests and returns without waiting for evaluation', async () => {
  const { service, state } = createFixture();
  const result = await service.requestAiMatches(organizationOneUser, 'vacancy-1', [
    'vacancy-candidate-1',
  ]);

  assert.deepEqual(result, { queuedCandidateIds: ['vacancy-candidate-1'] });
  assert.deepEqual(state.queueRequest, {
    user: organizationOneUser,
    vacancyId: 'vacancy-1',
    vacancyCandidateIds: ['vacancy-candidate-1'],
  });
  assert.deepEqual(state.scheduledEvaluations, [
    {
      user: organizationOneUser,
      vacancyId: 'vacancy-1',
      vacancyCandidateId: 'vacancy-candidate-1',
    },
  ]);
});
