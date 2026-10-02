import assert from 'node:assert/strict';
import test from 'node:test';

import { VacancyQuestionSetService } from '../dist/api-modules/vacancy-question-generation/vacancy-question-set.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function createFixture() {
  const globalQuestions = new Map([
    [
      'question-1',
      {
        id: 'question-1',
        technologyId: 'technology-1',
        difficulty: 'ADVANCED',
        estimatedAnswerTimeSeconds: 120,
        questionType: 'OPEN_ENDED',
        followUpAllowed: true,
        status: 'APPROVED',
        questionText: 'Explain dependency injection.',
        evaluationCriteria: { expected: 'composition root' },
      },
    ],
    [
      'question-2',
      {
        id: 'question-2',
        technologyId: 'technology-1',
        difficulty: 'ADVANCED',
        estimatedAnswerTimeSeconds: 180,
        questionType: 'OPEN_ENDED',
        followUpAllowed: false,
        status: 'APPROVED',
        questionText: 'Explain transactional consistency.',
        evaluationCriteria: { expected: 'atomicity' },
      },
    ],
    [
      'question-ineligible',
      {
        id: 'question-ineligible',
        technologyId: 'technology-2',
        difficulty: 'BEGINNER',
        estimatedAnswerTimeSeconds: 60,
        questionType: 'OPEN_ENDED',
        followUpAllowed: false,
        status: 'DRAFT',
        questionText: 'Ineligible question.',
        evaluationCriteria: {},
      },
    ],
  ]);
  const state = { customQuestions: [], vacancyQuestions: [], nextId: 1 };
  const vacancies = new Map([
    [
      'vacancy-1',
      {
        id: 'vacancy-1',
        organizationId: 'organization-1',
        difficulty: 'ADVANCED',
      },
    ],
    [
      'vacancy-2',
      {
        id: 'vacancy-2',
        organizationId: 'organization-1',
        difficulty: 'ADVANCED',
      },
    ],
    [
      'vacancy-3',
      {
        id: 'vacancy-3',
        organizationId: 'organization-2',
        difficulty: 'ADVANCED',
      },
    ],
  ]);
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const vacancyService = {
    async findOne(user, vacancyId) {
      const vacancy = vacancies.get(vacancyId);
      if (vacancy === undefined || vacancy.organizationId !== user.organizationId) {
        throw notFound('Vacancy not found.');
      }
      return vacancy;
    },
  };
  const questionService = {
    async findOne(questionId) {
      const question = globalQuestions.get(questionId);
      if (question === undefined) {
        throw notFound('Question not found.');
      }
      return question;
    },
  };
  const vacancyTechnologyService = {
    async findAll() {
      return [{ technologyId: 'technology-1' }];
    },
  };
  const rows = (where) =>
    state.vacancyQuestions.filter(
      (row) =>
        (where.vacancyId === undefined || row.vacancyId === where.vacancyId) &&
        (where.id === undefined || row.id === where.id) &&
        (where.questionId === undefined || row.questionId === where.questionId),
    );
  const vacancyQuestion = {
    async create({ data, include }) {
      const row = {
        id: `vacancy-question-${state.nextId++}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      if (
        state.vacancyQuestions.some(
          (item) => item.vacancyId === row.vacancyId && item.sequence === row.sequence,
        )
      ) {
        throw Object.assign(new Error('duplicate sequence'), { code: 'P2002' });
      }
      if (
        state.vacancyQuestions.some(
          (item) => item.vacancyId === row.vacancyId && item.questionId === row.questionId,
        )
      ) {
        throw Object.assign(new Error('duplicate question'), { code: 'P2002' });
      }
      state.vacancyQuestions.push(row);
      return include === undefined
        ? row
        : { ...row, question: globalQuestions.get(row.questionId) };
    },
    async findFirst({ where, include }) {
      const row = rows(where)[0] ?? null;
      return row === null || include === undefined
        ? row
        : { ...row, question: globalQuestions.get(row.questionId) };
    },
    async count({ where }) {
      return rows(where).length;
    },
    async findMany({ where, orderBy, include }) {
      const result = [...rows(where)];
      if (orderBy?.sequence === 'asc') {
        result.sort((left, right) => left.sequence - right.sequence);
      }
      if (orderBy?.sequence === 'desc') {
        result.sort((left, right) => right.sequence - left.sequence);
      }
      return include === undefined
        ? result
        : result.map((row) => ({ ...row, question: globalQuestions.get(row.questionId) }));
    },
    async update({ where, data, include }) {
      const row = state.vacancyQuestions.find((item) => item.id === where.id);
      Object.assign(row, data, { updatedAt: new Date() });
      return include === undefined
        ? row
        : { ...row, question: globalQuestions.get(row.questionId) };
    },
    async delete({ where }) {
      const index = state.vacancyQuestions.findIndex((item) => item.id === where.id);
      const [removed] = state.vacancyQuestions.splice(index, 1);
      return removed;
    },
  };
  const vacancyCustomQuestion = {
    async create({ data }) {
      const row = {
        id: `custom-question-${state.nextId++}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      if (
        state.customQuestions.some(
          (item) => item.vacancyId === row.vacancyId && item.displayOrder === row.displayOrder,
        )
      ) {
        throw Object.assign(new Error('duplicate display order'), { code: 'P2002' });
      }
      state.customQuestions.push(row);
      return row;
    },
    async count({ where }) {
      return state.customQuestions.filter((row) => row.vacancyId === where.vacancyId).length;
    },
    async delete({ where }) {
      const index = state.customQuestions.findIndex((row) => row.id === where.id);
      const [removed] = state.customQuestions.splice(index, 1);
      return removed;
    },
    async findFirst({ where }) {
      return (
        state.customQuestions.find(
          (row) =>
            (where.id === undefined || row.id === where.id) &&
            (where.vacancyId === undefined || row.vacancyId === where.vacancyId),
        ) ?? null
      );
    },
    async findMany({ where, orderBy }) {
      const rows = state.customQuestions.filter((row) => row.vacancyId === where.vacancyId);
      if (orderBy?.displayOrder === 'asc')
        rows.sort((left, right) => left.displayOrder - right.displayOrder);
      if (orderBy?.displayOrder === 'desc')
        rows.sort((left, right) => right.displayOrder - left.displayOrder);
      return rows;
    },
    async findUniqueOrThrow({ where }) {
      const row = state.customQuestions.find((item) => item.id === where.id);
      if (row === undefined) throw notFound('Custom vacancy question not found.');
      return row;
    },
    async update({ where, data }) {
      const row = state.customQuestions.find((item) => item.id === where.id);
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    },
  };
  const prisma = {
    vacancyQuestion,
    vacancyCustomQuestion,
    async $transaction(work) {
      const before = {
        customQuestions: state.customQuestions.map((question) => ({ ...question })),
        vacancyQuestions: state.vacancyQuestions.map((question) => ({ ...question })),
      };
      try {
        return await work({ vacancyCustomQuestion, vacancyQuestion });
      } catch (error) {
        state.customQuestions = before.customQuestions;
        state.vacancyQuestions = before.vacancyQuestions;
        throw error;
      }
    },
  };
  return {
    service: new VacancyQuestionSetService(
      prisma,
      vacancyService,
      vacancyTechnologyService,
      questionService,
    ),
    state,
    globalQuestions,
  };
}

test('selects an eligible global question as a vacancy-specific snapshot without changing the source', async () => {
  const { service, state, globalQuestions } = createFixture();
  const selected = await service.add(organizationOneUser, 'vacancy-1', {
    questionId: 'question-1',
  });

  assert.equal(selected.vacancyId, 'vacancy-1');
  assert.equal(selected.questionId, 'question-1');
  assert.equal(selected.sequence, 1);
  assert.equal(selected.estimatedAnswerTimeSeconds, 120);
  assert.equal(selected.questionText, globalQuestions.get('question-1').questionText);
  assert.equal(globalQuestions.get('question-1').questionText, 'Explain dependency injection.');
  assert.equal(state.vacancyQuestions.length, 1);
});

test('allows the same global question for multiple vacancies without changing the source', async () => {
  const { service, globalQuestions } = createFixture();
  const vacancyOneQuestion = await service.add(organizationOneUser, 'vacancy-1', {
    questionId: 'question-1',
  });
  const vacancyTwoQuestion = await service.add(organizationOneUser, 'vacancy-2', {
    questionId: 'question-1',
  });

  assert.equal(vacancyOneQuestion.questionText, 'Explain dependency injection.');
  assert.equal(vacancyOneQuestion.followUpAllowed, true);
  assert.equal(
    (await service.findAll(organizationOneUser, 'vacancy-2'))[0].questionText,
    vacancyTwoQuestion.questionText,
  );
  assert.equal(globalQuestions.get('question-1').questionText, 'Explain dependency injection.');
  assert.equal(globalQuestions.get('question-1').followUpAllowed, true);
});

test('removes only the current vacancy snapshot and preserves its global source and other vacancy selections', async () => {
  const { service, globalQuestions } = createFixture();
  const vacancyOneQuestion = await service.add(organizationOneUser, 'vacancy-1', {
    questionId: 'question-1',
  });
  await service.add(organizationOneUser, 'vacancy-2', { questionId: 'question-1' });
  await service.remove(organizationOneUser, 'vacancy-1', vacancyOneQuestion.id);

  assert.deepEqual(await service.findAll(organizationOneUser, 'vacancy-1'), []);
  assert.equal((await service.findAll(organizationOneUser, 'vacancy-2')).length, 1);
  assert.equal(globalQuestions.has('question-1'), true);
});

test('orders questions deterministically and rejects duplicate, incompatible, or unauthorized changes', async () => {
  const { service } = createFixture();
  const first = await service.add(organizationOneUser, 'vacancy-1', { questionId: 'question-1' });
  const second = await service.add(organizationOneUser, 'vacancy-1', { questionId: 'question-2' });
  await service.update(organizationOneUser, 'vacancy-1', second.id, { sequence: 1 });
  assert.deepEqual(
    (await service.findAll(organizationOneUser, 'vacancy-1')).map((question) => [
      question.id,
      question.sequence,
    ]),
    [
      [second.id, 1],
      [first.id, 2],
    ],
  );
  await assert.rejects(
    service.add(organizationOneUser, 'vacancy-1', { questionId: 'question-1' }),
    {
      status: 409,
    },
  );
  await assert.rejects(
    service.add(organizationOneUser, 'vacancy-1', { questionId: 'question-ineligible' }),
    { status: 422 },
  );
  await assert.rejects(
    service.update(organizationTwoUser, 'vacancy-1', first.id, { sequence: 2 }),
    {
      status: 404,
    },
  );
  await assert.rejects(service.remove(organizationOneUser, 'vacancy-2', first.id), { status: 404 });
});

test('manages vacancy-specific custom questions without creating Question Bank records', async () => {
  const { service, globalQuestions } = createFixture();
  const first = await service.createCustom(organizationOneUser, 'vacancy-1', {
    questionText: 'What was the most challenging project you owned?',
    evaluationCriteria: 'Assess ownership and decision-making.',
  });
  const second = await service.createCustom(organizationOneUser, 'vacancy-1', {
    questionText: 'How did you handle disagreement?',
  });

  assert.equal(first.displayOrder, 1);
  assert.equal(first.evaluationCriteria, 'Assess ownership and decision-making.');
  assert.equal(second.displayOrder, 2);
  assert.equal(second.evaluationCriteria, null);
  assert.equal(globalQuestions.size, 3);

  await service.updateCustom(organizationOneUser, 'vacancy-1', second.id, { displayOrder: 1 });
  await service.removeCustom(organizationOneUser, 'vacancy-1', first.id);
  assert.deepEqual(
    (await service.findAllCustom(organizationOneUser, 'vacancy-1')).map((question) => [
      question.id,
      question.displayOrder,
    ]),
    [[second.id, 1]],
  );
  await assert.rejects(
    service.updateCustom(organizationTwoUser, 'vacancy-1', second.id, { questionText: 'No.' }),
    { status: 404 },
  );
});
