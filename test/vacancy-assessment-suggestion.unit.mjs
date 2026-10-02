import assert from 'node:assert/strict';
import test from 'node:test';

import { OpenAiAssessmentAreaSuggestionService } from '../dist/api-modules/ai/openai-assessment-area-suggestion.service.js';
import { VacancyAssessmentSuggestionService } from '../dist/api-modules/vacancy-question-generation/vacancy-assessment-suggestion.service.js';
import { VacancyExperienceCompetencyService } from '../dist/api-modules/vacancy-question-generation/vacancy-experience-competency.service.js';

const user = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const extractedAreas = [
  { importance: 'HIGH', name: 'React.js' },
  { importance: 'HIGH', name: 'Node.js' },
  { importance: 'MEDIUM', name: 'AWS' },
  { importance: 'HIGH', name: ' Java ' },
  { importance: 'MEDIUM', name: 'java' },
];

function createFixture({ aiError } = {}) {
  const state = { aiCalls: 0, errorLogs: [], persistedAreas: [], record: null, stages: [] };
  const vacancy = {
    id: 'vacancy-1',
    organizationId: 'organization-1',
    title: 'Platform Engineer',
    experienceMax: 8,
    experienceMin: 5,
    jobDescription:
      'Own production deployments, improve release reliability, and mentor engineers.',
  };
  const prisma = {
    experienceCompetencyGeneration: {
      async create({ data }) {
        state.record = {
          id: 'generation-1',
          result: null,
          startedAt: null,
          completedAt: null,
          error: null,
          ...data,
        };
        return state.record;
      },
      async findFirst({ where }) {
        if (state.record === null) return null;
        const statuses = where.status?.in;
        return statuses === undefined || statuses.includes(state.record.status)
          ? state.record
          : null;
      },
      async findUnique() {
        return state.record === null ? null : { ...state.record, vacancy };
      },
      async updateMany({ where, data }) {
        if (
          state.record === null ||
          state.record.id !== where.id ||
          (where.status && state.record.status !== where.status)
        )
          return { count: 0 };
        state.record = { ...state.record, ...data };
        state.stages.push(state.record.stage);
        return { count: 1 };
      },
    },
  };
  const vacancyService = {
    async findOne(requestingUser, vacancyId) {
      if (requestingUser.organizationId !== vacancy.organizationId || vacancyId !== vacancy.id)
        throw Object.assign(new Error('Vacancy not found.'), { status: 404 });
      return vacancy;
    },
  };
  const experienceCompetencyService = {
    async replaceGeneratedAreas(vacancyId, areas) {
      assert.equal(vacancyId, vacancy.id);
      state.persistedAreas = areas;
    },
  };
  const aiService = {
    async analyzeRole(input) {
      state.aiCalls += 1;
      assert.deepEqual(Object.keys(input).sort(), ['jobDescription', 'seniority', 'vacancyTitle']);
      if (aiError) throw new Error('Provider unavailable');
      return { experienceAreas: extractedAreas };
    },
  };
  return {
    service: new VacancyAssessmentSuggestionService(
      prisma,
      vacancyService,
      experienceCompetencyService,
      aiService,
      { error: (message, context) => state.errorLogs.push({ context, message }) },
    ),
    state,
  };
}

test('queues the lightweight experience-area analysis without waiting for OpenAI', async () => {
  const { service, state } = createFixture();
  const generation = await service.start(user, 'vacancy-1');

  assert.equal(generation.status, 'QUEUED');
  assert.equal(generation.stage, 'PREPARING');
  assert.equal(generation.progress, 0);
  assert.equal(state.aiCalls, 0);
});

test('persists normalized free-form experience areas after one AI analysis call', async () => {
  const { service, state } = createFixture();
  const generation = await service.start(user, 'vacancy-1');
  await service.process(generation.generationId);

  assert.equal(state.aiCalls, 1);
  assert.equal(state.record.status, 'COMPLETED');
  assert.deepEqual(state.record.result, ['React.js', 'Node.js', 'AWS', 'Java']);
  assert.deepEqual(
    state.persistedAreas.map((area) => area.name),
    ['React.js', 'Node.js', 'AWS', 'Java'],
  );
  assert.equal(
    state.persistedAreas.some((area) => area.name === 'Java'),
    true,
  );
  assert.deepEqual(state.stages, ['ANALYZING_JOB', 'SAVING_AREAS', 'COMPLETED']);
});

test('stores five deterministic questions for every generated free-form area', async () => {
  const state = { createdAreas: [], experienceAreas: [] };
  const transaction = {
    vacancy: {
      async findUnique() {
        return { id: 'vacancy-1' };
      },
      async update({ data }) {
        state.experienceAreas = data.experienceAreas;
      },
    },
    vacancyExperienceArea: {
      async create({ data }) {
        state.createdAreas.push(data);
        return data;
      },
      async deleteMany() {},
      async findMany() {
        return state.createdAreas.map((area) => ({ name: area.name }));
      },
    },
    vacancyExperienceQuestion: { async deleteMany() {} },
  };
  const prisma = { $transaction: async (operation) => operation(transaction) };
  const service = new VacancyExperienceCompetencyService(prisma, {});

  await service.replaceGeneratedAreas('vacancy-1', [
    { importance: 'HIGH', name: 'Java' },
    { importance: 'MEDIUM', name: 'Team leadership' },
  ]);

  assert.deepEqual(state.experienceAreas, ['Java', 'Team leadership']);
  assert.equal(state.createdAreas.length, 2);
  for (const area of state.createdAreas) {
    assert.equal(area.vacancyId, 'vacancy-1');
    assert.equal(area.questions.create.length, 5);
    assert.deepEqual(
      area.questions.create.map((question) => question.sequence),
      [1, 2, 3, 4, 5],
    );
    assert.equal(
      area.questions.create.every((question) => question.questionText.includes(area.name)),
      true,
    );
  }
});

test('saves the reviewed area configuration without restoring removed questions', async () => {
  const state = { createdAreas: [], experienceAreas: [] };
  const transaction = {
    vacancy: {
      async update({ data }) {
        state.experienceAreas = data.experienceAreas;
      },
    },
    vacancyExperienceArea: {
      async create({ data }) {
        state.createdAreas.push(data);
        return data;
      },
      async deleteMany() {
        state.createdAreas = [];
      },
      async findMany() {
        return state.createdAreas.map((area) => ({ name: area.name }));
      },
    },
    vacancyExperienceQuestion: { async deleteMany() {} },
  };
  const prisma = { $transaction: async (operation) => operation(transaction) };
  const vacancyService = {
    async findOne() {
      return { id: 'vacancy-1' };
    },
  };
  const service = new VacancyExperienceCompetencyService(prisma, vacancyService);

  const saved = await service.saveConfiguration(user, 'vacancy-1', {
    areas: [
      {
        importance: 'HIGH',
        name: ' Java ',
        questions: [
          {
            questionText:
              'How many years of professional experience do you have working with Java?',
          },
          { questionText: 'What have you personally worked on using Java?' },
          { questionText: 'What responsibilities did you personally have when working with Java?' },
          {
            questionText:
              'Tell us about some significant problems or challenges you handled while working with Java.',
          },
        ],
      },
    ],
  });

  assert.deepEqual(state.experienceAreas, ['Java']);
  assert.equal(saved.length, 1);
  assert.equal(state.createdAreas[0].questions.create.length, 4);
  assert.deepEqual(
    state.createdAreas[0].questions.create.map((question) => question.sequence),
    [1, 2, 3, 4],
  );
});

test('persists a safe failure and allows another generation after an AI failure', async () => {
  const { service, state } = createFixture({ aiError: true });
  const first = await service.start(user, 'vacancy-1');
  const duplicate = await service.start(user, 'vacancy-1');
  assert.equal(duplicate.generationId, first.generationId);

  await service.process(first.generationId);
  assert.equal(state.record.status, 'FAILED');
  assert.equal(state.record.error, 'Provider unavailable');
  assert.equal(state.errorLogs.length, 1);
  assert.equal(state.errorLogs[0].context.generationId, first.generationId);
  assert.equal(state.errorLogs[0].context.error.message, 'Provider unavailable');
  const retry = await service.start(user, 'vacancy-1');
  assert.equal(retry.status, 'QUEUED');
});

test('enforces vacancy authorization before analysis', async () => {
  const { service } = createFixture();
  await assert.rejects(service.start({ ...user, organizationId: 'organization-2' }, 'vacancy-1'), {
    status: 404,
  });
});

test('rejects malformed compact area extraction output', async () => {
  const service = new OpenAiAssessmentAreaSuggestionService(
    { responses: { parse: async () => ({ output_parsed: { experienceAreas: [{ name: '' }] } }) } },
    'test-model',
  );
  await assert.rejects(
    service.analyzeRole({
      jobDescription: 'A detailed job description.',
      seniority: '5-8 years of experience',
      vacancyTitle: 'Role',
    }),
    { status: 500 },
  );
});
