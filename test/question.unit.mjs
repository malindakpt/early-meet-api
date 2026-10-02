import assert from 'node:assert/strict';
import test from 'node:test';

import { QuestionService } from '../dist/api-modules/questions/question.service.js';

function questionData(overrides = {}) {
  return {
    technologyId: 'technology-1',
    technologySegmentId: 'segment-1',
    difficulty: 'INTERMEDIATE',
    estimatedAnswerTimeSeconds: 120,
    questionType: 'OPEN_ENDED',
    followUpAllowed: true,
    status: 'APPROVED',
    questionText: 'Explain generic constraints.',
    evaluationCriteria: { accuracy: 'Correct explanation' },
    metaData: { topic: 'generics' },
    ...overrides,
  };
}

function createFixture() {
  const state = {
    questions: new Map(),
    segments: new Map([
      ['segment-1', { id: 'segment-1', name: 'Fundamentals', technologyId: 'technology-1' }],
      ['segment-2', { id: 'segment-2', name: 'Advanced', technologyId: 'technology-1' }],
      ['segment-3', { id: 'segment-3', name: 'Runtime', technologyId: 'technology-2' }],
    ]),
    technologies: new Map([
      ['technology-1', { id: 'technology-1', name: 'TypeScript' }],
      ['technology-2', { id: 'technology-2', name: 'Node.js' }],
    ]),
    failImport: false,
    nextId: 1,
  };
  const technologyService = {
    async findAll() {
      return [...state.technologies.values()];
    },
    async findOne(technologyId) {
      const technology = state.technologies.get(technologyId);
      if (!technology) {
        const error = new Error('Technology not found.');
        error.status = 404;
        throw error;
      }
      return technology;
    },
  };
  const technologySegmentService = {
    async findAllAcrossTechnologies() {
      return [...state.segments.values()];
    },
    async findOne(technologyId, technologySegmentId) {
      const segment = state.segments.get(technologySegmentId);
      if (!segment || segment.technologyId !== technologyId) {
        const error = new Error('Technology segment not found.');
        error.status = 404;
        throw error;
      }
      return segment;
    },
  };
  const prisma = {
    async $transaction(callback) {
      return callback(this);
    },
    question: {
      async create({ data }) {
        const question = {
          id: `question-${state.nextId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.questions.set(question.id, question);
        return question;
      },
      async createMany({ data }) {
        if (state.failImport) throw new Error('database failure');
        for (const values of data) {
          await this.create({ data: values });
        }
        return { count: data.length };
      },
      async findMany({ where }) {
        state.lastFindMany = { where };
        return [...state.questions.values()].filter(
          (question) =>
            (where.technologyId === undefined || question.technologyId === where.technologyId) &&
            (where.technologySegmentId === undefined ||
              question.technologySegmentId === where.technologySegmentId) &&
            (where.difficulty === undefined || question.difficulty === where.difficulty) &&
            (where.questionType === undefined || question.questionType === where.questionType) &&
            (where.status === undefined || question.status === where.status),
        );
      },
      async findUnique({ where }) {
        return state.questions.get(where.id) ?? null;
      },
      async update({ where, data }) {
        const question = state.questions.get(where.id);
        Object.assign(question, data, { updatedAt: new Date() });
        return question;
      },
    },
  };
  const questionService = new QuestionService(prisma, technologyService, technologySegmentService);
  const platformAdmin = { id: 'admin-1', organizationId: 'organization-1', role: 'PLATFORM_ADMIN' };
  const create = questionService.create.bind(questionService);
  const importCsv = questionService.importCsv.bind(questionService);
  const findAll = questionService.findAll.bind(questionService);
  questionService.create = (dto) => create(platformAdmin, dto);
  questionService.importCsv = (csv) => importCsv(platformAdmin, csv);
  questionService.findAll = (query) => findAll(platformAdmin, query);
  return {
    service: questionService,
    state,
  };
}

test('creates questions only for matching existing technology and segments', async () => {
  const { service } = createFixture();
  const question = await service.create(questionData());

  assert.equal(question.technologyId, 'technology-1');
  assert.equal(question.technologySegmentId, 'segment-1');
  await assert.rejects(service.create(questionData({ technologyId: 'missing-technology' })), {
    status: 404,
  });
  await assert.rejects(service.create(questionData({ technologySegmentId: 'missing-segment' })), {
    status: 404,
  });
  await assert.rejects(
    service.create(
      questionData({ technologyId: 'technology-1', technologySegmentId: 'segment-3' }),
    ),
    { status: 404 },
  );
});

test('defaults the retained question type when it is not supplied', async () => {
  const { service } = createFixture();
  const request = questionData();
  delete request.questionType;

  const question = await service.create(request);

  assert.equal(question.questionType, 'GENERAL');
});

const importHeaders =
  'question,technology,technologySegment,difficulty,estimatedAnswerTimeSeconds,evaluationCriteria,allowFollowUp';
const importRow =
  '"Explain generic constraints.",TypeScript,Fundamentals,INTERMEDIATE,120,"{""accuracy"":""Correct explanation""}",true';

test('previews valid CSV imports without persisting questions and preserves follow-up eligibility', async () => {
  const { service, state } = createFixture();
  const preview = await service.previewCsvImport(`${importHeaders}\n${importRow}`);

  assert.equal(preview.totalRows, 1);
  assert.equal(preview.validRows, 1);
  assert.equal(preview.rows[0].allowFollowUp, true);
  assert.equal(state.questions.size, 0);
});

test('rejects annotated headers so generated CSV uses the canonical format', async () => {
  const { service } = createFixture();
  const annotatedHeaders =
    '"question","technology (possible values: TypeScript | Node.js)","technologySegment (possible values: TypeScript / Fundamentals | Node.js / Runtime)","difficulty (possible values: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT)","evaluationCriteria","allowFollowUp (possible values: true | false)"';

  await assert.rejects(service.previewCsvImport(`${annotatedHeaders}\n${importRow}`), {
    status: 422,
  });
});

test('blocks imports for invalid rows, duplicate questions, and more than fifty rows', async () => {
  const { service, state } = createFixture();
  const invalid = await service.previewCsvImport(`${importHeaders}\n${importRow}\n${importRow}`);
  assert.equal(invalid.errors[0].message, 'Duplicate question found within CSV.');
  await assert.rejects(service.importCsv(`${importHeaders}\n${importRow}\n${importRow}`), {
    status: 422,
  });
  assert.equal(state.questions.size, 0);

  const rows = Array.from({ length: 51 }, (_, index) =>
    importRow.replace('constraints.', `constraints ${index}.`),
  );
  const tooMany = await service.previewCsvImport(`${importHeaders}\n${rows.join('\n')}`);
  assert.equal(tooMany.errors[0].message, 'Bulk import is limited to 50 questions per CSV.');
});

test('imports validated CSV rows atomically and uses backend-only question type defaults', async () => {
  const { service, state } = createFixture();
  const result = await service.importCsv(`${importHeaders}\n${importRow}`);
  assert.equal(result.importedCount, 1);
  assert.equal(state.questions.size, 1);
  const question = state.questions.get('question-1');
  assert.equal(question.followUpAllowed, true);
  assert.equal(question.estimatedAnswerTimeSeconds, 120);
  assert.equal(question.questionType, 'GENERAL');

  const failed = createFixture();
  failed.state.failImport = true;
  await assert.rejects(failed.service.importCsv(`${importHeaders}\n${importRow}`));
  assert.equal(failed.state.questions.size, 0);
});

test('filters questions by technology, segment, difficulty, type, status, and their combination', async () => {
  const { service } = createFixture();
  const typeScript = await service.create(questionData());
  const advanced = await service.create(
    questionData({
      technologySegmentId: 'segment-2',
      difficulty: 'ADVANCED',
      questionType: 'CODING',
    }),
  );
  const java = await service.create(
    questionData({
      technologyId: 'technology-2',
      technologySegmentId: 'segment-3',
      status: 'ARCHIVED',
    }),
  );

  assert.deepEqual(await service.findAll({ technologyId: 'technology-1' }), [typeScript, advanced]);
  assert.deepEqual(await service.findAll({ technologySegmentId: 'segment-2' }), [advanced]);
  assert.deepEqual(await service.findAll({ difficulty: 'ADVANCED' }), [advanced]);
  assert.deepEqual(await service.findAll({ questionType: 'OPEN_ENDED' }), [typeScript, java]);
  assert.deepEqual(await service.findAll({ status: 'APPROVED' }), [typeScript, advanced, java]);
  assert.deepEqual(
    await service.findAll({
      technologyId: 'technology-1',
      difficulty: 'ADVANCED',
      questionType: 'CODING',
    }),
    [advanced],
  );
});

test('finds only active templates for configured technologies and exact vacancy difficulty', async () => {
  const { service, state } = createFixture();

  await service.findEligibleForVacancyGeneration(['technology-1', 'technology-2'], 'ADVANCED');

  assert.deepEqual(state.lastFindMany, {
    where: {
      technologyId: { in: ['technology-1', 'technology-2'] },
      difficulty: 'ADVANCED',
      status: 'APPROVED',
    },
  });
});

test('retrieves existing questions and returns not found for missing identifiers', async () => {
  const { service } = createFixture();
  const question = await service.create(questionData());

  assert.deepEqual(await service.findOne(question.id), question);
  await assert.rejects(service.findOne('missing-question'), { status: 404 });
});

test('partially updates all supplied fields and preserves unspecified values', async () => {
  const { service } = createFixture();
  const question = await service.create(questionData());
  const updated = await service.update(question.id, {
    difficulty: 'ADVANCED',
    questionText: 'Explain advanced generic constraints.',
    followUpAllowed: false,
  });

  assert.equal(updated.difficulty, 'ADVANCED');
  assert.equal(updated.questionText, 'Explain advanced generic constraints.');
  assert.equal(updated.followUpAllowed, false);
  assert.equal(updated.technologyId, 'technology-1');
  assert.equal(updated.technologySegmentId, 'segment-1');
  assert.deepEqual(updated.evaluationCriteria, { accuracy: 'Correct explanation' });
  assert.equal(updated.createdAt, question.createdAt);
});

test('validates final technology and segment relationship for partial updates', async () => {
  const { service } = createFixture();
  const question = await service.create(questionData());

  await assert.rejects(service.update(question.id, { technologyId: 'technology-2' }), {
    status: 404,
  });
  await assert.rejects(service.update(question.id, { technologySegmentId: 'segment-3' }), {
    status: 404,
  });
  const updated = await service.update(question.id, {
    technologyId: 'technology-2',
    technologySegmentId: 'segment-3',
  });
  assert.equal(updated.technologyId, 'technology-2');
  assert.equal(updated.technologySegmentId, 'segment-3');
});
