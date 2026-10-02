import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate as scheduleImmediate } from 'node:timers';

import { CandidateVacancyEvaluationScheduler } from '../dist/api-modules/candidate-matching/candidate-vacancy-evaluation-scheduler.service.js';
import { CandidateVacancyEvaluationService } from '../dist/api-modules/candidate-matching/candidate-vacancy-evaluation.service.js';
import { MatchScoreCalculatorService } from '../dist/api-modules/candidate-matching/match-score-calculator.service.js';
import { TechnologyMatchingService } from '../dist/api-modules/candidate-matching/technology-matching.service.js';

const user = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const otherOrganizationUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function validExtractedData() {
  return {
    candidate: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+94111234567',
      location: 'Colombo',
      linkedInUrl: 'https://example.com/ada',
      portfolioUrl: null,
    },
    summary: 'Backend engineer.',
    skills: [{ name: 'Node.js', category: 'Backend', yearsOfExperience: 4 }],
    workExperience: [
      {
        company: 'Example Co',
        jobTitle: 'Backend Engineer',
        location: 'Colombo',
        startDate: '2021',
        endDate: null,
        isCurrent: true,
        description: 'Built API services.',
        technologies: ['Node.js', 'PostgreSQL'],
      },
    ],
    education: [],
    certifications: [],
  };
}

// One model response carries both the CV extraction and the vacancy evaluation.
const evaluation = {
  cv: validExtractedData(),
  score: 82,
  summary: 'The candidate has relevant backend experience but the CV does not demonstrate AWS.',
  matchedRequirements: ['The CV demonstrates Node.js experience relevant to the backend role.'],
  missingRequirements: ['The CV does not demonstrate AWS experience.'],
};

const cvText = 'Ada Lovelace\nada@example.com\nBackend engineer. Node.js, PostgreSQL.';

function createFixture({ cvError, llmError } = {}) {
  const state = { completions: [], inputs: [], logs: [], llmCalls: 0 };
  const vacancyCandidate = {
    id: 'vacancy-candidate-1',
    candidateId: 'candidate-1',
    vacancyId: 'vacancy-1',
    candidate: { id: 'candidate-1', name: 'ada@example.com', email: 'ada@example.com' },
  };
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const vacancyCandidateService = {
    async findOne(currentUser, vacancyId, vacancyCandidateId) {
      if (
        currentUser.organizationId !== 'organization-1' ||
        vacancyId !== 'vacancy-1' ||
        vacancyCandidateId !== 'vacancy-candidate-1'
      ) {
        throw notFound('Vacancy candidate not found.');
      }
      return vacancyCandidate;
    },
    async completeAiMatch(vacancyCandidateId, result) {
      state.completions.push({ vacancyCandidateId, result });
    },
    async getCvTextForAiMatch() {
      if (cvError !== undefined) {
        throw cvError;
      }
      return cvText;
    },
  };
  const vacancyService = {
    async findOne() {
      return {
        id: 'vacancy-1',
        title: 'Backend Engineer',
        jobDescription: 'Build reliable Node.js services.',
        experienceMin: 3,
        experienceMax: 6,
        employmentType: 'FULL_TIME',
        workType: 'REMOTE',
      };
    },
  };
  const vacancyTechnologyService = {
    async findAll() {
      return [
        { technology: { name: 'Node.js' }, requirementType: 'REQUIRED', segments: [] },
        {
          technology: { name: 'PostgreSQL' },
          requirementType: 'PREFERRED',
          segments: [{ name: 'Indexing' }],
        },
        { technology: { name: 'AWS' }, requirementType: 'PREFERRED', segments: [] },
      ];
    },
  };
  const evaluationLlmService = {
    async evaluate(input) {
      state.llmCalls += 1;
      state.inputs.push(input);
      if (llmError !== undefined) {
        throw llmError;
      }
      return evaluation;
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
  return {
    service: new CandidateVacancyEvaluationService(
      evaluationLlmService,
      vacancyCandidateService,
      vacancyService,
      vacancyTechnologyService,
      new TechnologyMatchingService(),
      scoreCalculator,
      logger,
    ),
    state,
    evaluationLlmService,
  };
}

test('extracts and evaluates the CV against the vacancy in one AI call and persists both', async () => {
  const { service, state } = createFixture();
  await service.process(user, 'vacancy-1', 'vacancy-candidate-1');

  assert.equal(state.llmCalls, 1);
  assert.equal(state.inputs[0].cvText, cvText);
  assert.equal(state.inputs[0].vacancy.title, 'Backend Engineer');
  assert.equal(state.inputs[0].vacancy.description, 'Build reliable Node.js services.');
  assert.deepEqual(state.inputs[0].vacancy.technologies, [
    { name: 'Node.js', requirementType: 'REQUIRED', segments: [] },
    { name: 'PostgreSQL', requirementType: 'PREFERRED', segments: ['Indexing'] },
    { name: 'AWS', requirementType: 'PREFERRED', segments: [] },
  ]);
  assert.deepEqual(state.completions, [
    {
      vacancyCandidateId: 'vacancy-candidate-1',
      result: {
        extractedData: evaluation.cv,
        gaps: evaluation.missingRequirements,
        preferredTechnologiesMet: ['PostgreSQL'],
        requiredTechnologiesMet: ['Node.js'],
        score: evaluation.score,
        strengths: evaluation.matchedRequirements,
        summary: evaluation.summary,
        // Deterministic coverage: (1/1 * 70 + 1/2 * 30) / 100.
        vacancyMatchScore: 85,
      },
    },
  ]);
  assert.equal(JSON.stringify(state.logs).includes('Backend engineer.'), false);
  assert.equal(JSON.stringify(state.logs).includes('Ada Lovelace'), false);
});

test('rejects unauthorized associations and missing CV text without calling the LLM', async () => {
  const missingCv = Object.assign(new Error('The candidate has no uploaded CV text.'), {
    status: 409,
  });
  const missing = createFixture({ cvError: missingCv });
  await assert.rejects(missing.service.process(user, 'vacancy-1', 'vacancy-candidate-1'), {
    status: 409,
  });
  assert.equal(missing.state.llmCalls, 0);

  const unauthorized = createFixture();
  await assert.rejects(
    unauthorized.service.process(otherOrganizationUser, 'vacancy-1', 'vacancy-candidate-1'),
    { status: 404 },
  );
  assert.equal(unauthorized.state.llmCalls, 0);
});

test('persists nothing after an LLM failure and can retry', async () => {
  const failure = createFixture({ llmError: new Error('rate limited') });
  await assert.rejects(failure.service.process(user, 'vacancy-1', 'vacancy-candidate-1'));
  assert.equal(failure.state.completions.length, 0);

  failure.evaluationLlmService.evaluate = async (input) => {
    failure.state.llmCalls += 1;
    failure.state.inputs.push(input);
    return evaluation;
  };
  await failure.service.process(user, 'vacancy-1', 'vacancy-candidate-1');
  assert.equal(failure.state.completions.length, 1);
});

test('scheduler marks the match failed when the AI workflow throws', async () => {
  const calls = [];
  const evaluationService = {
    async claim() {
      return true;
    },
    async fail(vacancyCandidateId) {
      calls.push(['fail', vacancyCandidateId]);
    },
    async process() {
      throw new Error('rate limited');
    },
  };
  const scheduler = new CandidateVacancyEvaluationScheduler(evaluationService, { error() {} });
  scheduler.schedule(user, 'vacancy-1', 'vacancy-candidate-1');
  await new Promise((resolve) => scheduleImmediate(resolve));
  await new Promise((resolve) => scheduleImmediate(resolve));
  assert.deepEqual(calls, [['fail', 'vacancy-candidate-1']]);
});

test('scheduler suppresses concurrent evaluation work for the same vacancy candidate', async () => {
  let release;
  let calls = 0;
  const evaluationService = {
    async claim() {
      return true;
    },
    async fail() {},
    async process() {
      calls += 1;
      await new Promise((resolve) => {
        release = resolve;
      });
    },
  };
  const scheduler = new CandidateVacancyEvaluationScheduler(evaluationService, {
    error() {},
  });
  scheduler.schedule(user, 'vacancy-1', 'vacancy-candidate-1');
  scheduler.schedule(user, 'vacancy-1', 'vacancy-candidate-1');
  await new Promise((resolve) => scheduleImmediate(resolve));
  assert.equal(calls, 1);

  release();
  await new Promise((resolve) => scheduleImmediate(resolve));
});
