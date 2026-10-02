import assert from 'node:assert/strict';
import test from 'node:test';

import { VacancyQuestionGenerationService } from '../dist/api-modules/vacancy-question-generation/vacancy-question-generation.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function createFixture({ failOnCreate = false, vacancyTechnologies, questions } = {}) {
  const state = {
    questions: [],
    vacancy: {
      id: 'vacancy-1',
      organizationId: 'organization-1',
      difficulty: 'ADVANCED',
    },
    vacancyTechnologies: vacancyTechnologies ?? [
      {
        technologyId: 'technology-a',
        requirementType: 'REQUIRED',
        segmentSelections: ['ALL'],
      },
      {
        technologyId: 'technology-b',
        requirementType: 'PREFERRED',
        segmentSelections: ['ALL'],
      },
    ],
    eligibleQuestions: questions ?? [
      question('question-a-1', 'technology-a', 'segment-a-1'),
      question('question-a-2', 'technology-a', 'segment-a-2'),
      question('question-a-3', 'technology-a', 'segment-a-1'),
      question('question-b-1', 'technology-b', 'segment-b-1'),
    ],
    nextId: 1,
    createAttempts: 0,
  };
  const notFound = () => Object.assign(new Error('Vacancy not found.'), { status: 404 });
  const conflict = (message) => Object.assign(new Error(message), { status: 409 });
  const unprocessable = (message) => Object.assign(new Error(message), { status: 422 });
  const vacancyService = {
    async findOne(user, vacancyId) {
      if (vacancyId !== state.vacancy.id || user.organizationId !== state.vacancy.organizationId) {
        throw notFound();
      }
      return state.vacancy;
    },
  };
  const vacancyTechnologyService = {
    async findAll(user, vacancyId) {
      await vacancyService.findOne(user, vacancyId);
      return state.vacancyTechnologies;
    },
  };
  const questionService = {
    async findEligibleForVacancyGeneration(technologyIds, difficulty) {
      state.eligibleQuery = { technologyIds, difficulty };
      return state.eligibleQuestions;
    },
  };
  const transaction = {
    vacancyQuestion: {
      async findFirst({ where }) {
        return state.questions.find((question) => question.vacancyId === where.vacancyId) ?? null;
      },
      async create({ data }) {
        state.createAttempts += 1;
        if (failOnCreate && state.createAttempts === 2) {
          throw new Error('database failure');
        }
        const created = { id: `vacancy-question-${state.nextId++}`, ...data };
        state.questions.push(created);
        return created;
      },
    },
  };
  const prisma = {
    async $transaction(work) {
      const before = [...state.questions];
      try {
        return await work(transaction);
      } catch (error) {
        state.questions = before;
        throw error;
      }
    },
  };
  return {
    service: new VacancyQuestionGenerationService(
      prisma,
      vacancyService,
      vacancyTechnologyService,
      questionService,
    ),
    state,
    conflict,
    unprocessable,
  };
}

function question(id, technologyId, technologySegmentId, overrides = {}) {
  return {
    id,
    technologyId,
    technologySegmentId,
    difficulty: 'ADVANCED',
    questionType: 'OPEN_ENDED',
    followUpAllowed: true,
    status: 'ACTIVE',
    questionText: `Question ${id}`,
    evaluationCriteria: { expected: id },
    metaData: { source: 'question-bank' },
    ...overrides,
  };
}

test('generates active exact-difficulty question snapshots for an authorized vacancy', async () => {
  const { service, state } = createFixture();
  const response = await service.generate(organizationOneUser, 'vacancy-1');

  assert.equal(response.vacancyId, 'vacancy-1');
  assert.equal(response.generatedCount, 4);
  assert.deepEqual(state.eligibleQuery, {
    technologyIds: ['technology-a', 'technology-b'],
    difficulty: 'ADVANCED',
  });
  assert.deepEqual(
    response.questions.map((generated) => [generated.questionId, generated.sequence]),
    [
      ['question-a-1', 1],
      ['question-a-2', 2],
      ['question-a-3', 3],
      ['question-b-1', 4],
    ],
  );
  assert.deepEqual(
    state.questions.map((generated) => ({
      questionText: generated.questionText,
      evaluationCriteria: generated.evaluationCriteria,
      difficulty: generated.difficulty,
      questionType: generated.questionType,
      followUpAllowed: generated.followUpAllowed,
    })),
    [
      {
        questionText: 'Question question-a-1',
        evaluationCriteria: { expected: 'question-a-1' },
        difficulty: 'ADVANCED',
        questionType: 'OPEN_ENDED',
        followUpAllowed: true,
      },
      {
        questionText: 'Question question-a-2',
        evaluationCriteria: { expected: 'question-a-2' },
        difficulty: 'ADVANCED',
        questionType: 'OPEN_ENDED',
        followUpAllowed: true,
      },
      {
        questionText: 'Question question-a-3',
        evaluationCriteria: { expected: 'question-a-3' },
        difficulty: 'ADVANCED',
        questionType: 'OPEN_ENDED',
        followUpAllowed: true,
      },
      {
        questionText: 'Question question-b-1',
        evaluationCriteria: { expected: 'question-b-1' },
        difficulty: 'ADVANCED',
        questionType: 'OPEN_ENDED',
        followUpAllowed: true,
      },
    ],
  );
});

test('rejects nonexistent and cross-organization vacancies', async () => {
  const { service } = createFixture();

  await assert.rejects(service.generate(organizationOneUser, 'missing-vacancy'), { status: 404 });
  await assert.rejects(service.generate(organizationTwoUser, 'vacancy-1'), { status: 404 });
});

test('requires vacancy technology configuration and allows an empty set when no templates match', async () => {
  const withoutTechnologies = createFixture({ vacancyTechnologies: [] });
  await assert.rejects(withoutTechnologies.service.generate(organizationOneUser, 'vacancy-1'), {
    status: 422,
  });

  const withoutQuestions = createFixture({ questions: [] });
  const response = await withoutQuestions.service.generate(organizationOneUser, 'vacancy-1');
  assert.equal(response.generatedCount, 0);
  assert.deepEqual(withoutQuestions.state.questions, []);
});

test('orders generated questions deterministically across segments and required technologies first', async () => {
  const { service, state } = createFixture({
    vacancyTechnologies: [
      {
        technologyId: 'technology-a',
        requirementType: 'PREFERRED',
        segmentSelections: ['ALL'],
      },
      {
        technologyId: 'technology-b',
        requirementType: 'REQUIRED',
        segmentSelections: ['ALL'],
      },
      {
        technologyId: 'technology-c',
        requirementType: 'REQUIRED',
        segmentSelections: ['ALL'],
      },
    ],
    questions: [
      question('b-2', 'technology-b', 'segment-b-2'),
      question('a-1', 'technology-a', 'segment-a-1'),
      question('c-1', 'technology-c', 'segment-c-1'),
      question('b-1', 'technology-b', 'segment-b-1'),
      question('b-3', 'technology-b', 'segment-b-1'),
    ],
  });

  await service.generate(organizationOneUser, 'vacancy-1');

  assert.deepEqual(
    state.questions.map(({ questionId, sequence }) => [questionId, sequence]),
    [
      ['b-1', 1],
      ['b-2', 2],
      ['c-1', 3],
      ['b-3', 4],
      ['a-1', 5],
    ],
  );
});

test('includes every current segment when ALL is configured and only selected segments otherwise', async () => {
  const { service, state } = createFixture({
    vacancyTechnologies: [
      {
        technologyId: 'technology-a',
        requirementType: 'REQUIRED',
        segmentSelections: ['ALL'],
      },
      {
        technologyId: 'technology-b',
        requirementType: 'PREFERRED',
        segmentSelections: ['segment-b-1'],
      },
    ],
    questions: [
      question('a-current', 'technology-a', 'segment-added-later'),
      question('b-selected', 'technology-b', 'segment-b-1'),
      question('b-unselected', 'technology-b', 'segment-b-2'),
    ],
  });

  await service.generate(organizationOneUser, 'vacancy-1');

  assert.deepEqual(
    state.questions.map(({ questionId }) => questionId),
    ['a-current', 'b-selected'],
  );
});

test('limits each required technology to three questions and each preferred technology to one', async () => {
  const { service, state } = createFixture({
    questions: [
      question('a-1', 'technology-a', 'segment-a-1'),
      question('a-2', 'technology-a', 'segment-a-2'),
      question('a-3', 'technology-a', 'segment-a-3'),
      question('a-4', 'technology-a', 'segment-a-1'),
      question('b-1', 'technology-b', 'segment-b-1'),
      question('b-2', 'technology-b', 'segment-b-2'),
    ],
  });

  await service.generate(organizationOneUser, 'vacancy-1');

  assert.deepEqual(
    state.questions.map(({ questionId }) => questionId),
    ['a-1', 'a-2', 'a-3', 'b-1'],
  );
});

test('does not regenerate an existing question set', async () => {
  const { service, state } = createFixture();
  await service.generate(organizationOneUser, 'vacancy-1');
  const createdCount = state.questions.length;

  await assert.rejects(service.generate(organizationOneUser, 'vacancy-1'), { status: 409 });
  assert.equal(state.questions.length, createdCount);
});

test('rolls back every snapshot when generation fails partway through', async () => {
  const { service, state } = createFixture({ failOnCreate: true });

  await assert.rejects(service.generate(organizationOneUser, 'vacancy-1'), /database failure/);
  assert.deepEqual(state.questions, []);
});
