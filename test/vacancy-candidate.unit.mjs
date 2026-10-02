import assert from 'node:assert/strict';
import test from 'node:test';

import {
  toUploadTimestampName,
  VacancyCandidateService,
} from '../dist/api-modules/vacancy-candidates/vacancy-candidate.service.js';

const user = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };

function createFixture() {
  const state = { candidates: [], associations: [] };
  const prisma = {
    candidate: {
      async create({ data }) {
        const candidate = { id: `candidate-${state.candidates.length + 1}`, ...data };
        state.candidates.push(candidate);
        return candidate;
      },
    },
    vacancyCandidate: {
      async create({ data }) {
        const association = { id: `association-${state.associations.length + 1}`, ...data };
        state.associations.push(association);
        return association;
      },
      async findFirst({ where }) {
        return (
          state.associations.find((association) => {
            const candidate = state.candidates.find((item) => item.id === association.candidateId);
            return (
              association.vacancyId === where.vacancyId &&
              candidate?.email === where.candidate.is.email
            );
          }) ?? null
        );
      },
    },
    async $transaction(operation) {
      if (typeof operation === 'function') {
        return operation({ ...this, $executeRaw: async () => 1 });
      }
      return Promise.all(operation);
    },
  };
  const service = new VacancyCandidateService(prisma, { async findOne() {} }, {});
  return { service, state };
}

function upload(candidates) {
  return { candidates };
}

test('persists each non-duplicate CV upload without any AI processing', async () => {
  const { service, state } = createFixture();
  const keywordMatchBreakdown = {
    matchedSegments: [],
    matchedTechnologies: ['Node.js'],
    preferredMatched: 0,
    preferredTotal: 0,
    requiredMatched: 1,
    requiredTotal: 1,
  };
  const result = await service.uploadCvs(
    user,
    'vacancy-1',
    upload([
      {
        fileName: 'ada.pdf',
        email: 'Ada@Example.com ',
        extractedText: 'Ada CV',
        keywordMatchBreakdown,
        keywordMatchScore: 70,
      },
      { fileName: 'grace.pdf', email: 'grace@example.com', extractedText: 'Grace CV' },
    ]),
  );

  assert.deepEqual(
    result.items.map((item) => item.status),
    ['CREATED', 'CREATED'],
  );
  assert.equal(state.candidates.length, 2);
  assert.equal(state.associations.length, 2);
  // The service has no AI dependency at all; the CV is complete and awaits an HR AI match.
  assert.equal(state.candidates[0].email, 'ada@example.com');
  // Provisional name until the AI CV match extracts the real one.
  assert.equal(state.candidates[0].name, 'ada@example.com');
  assert.equal(state.candidates[0].processingStatus, 'READY');
  assert.equal(state.candidates[0].cvExtractedText, 'Ada CV');
  assert.equal(state.candidates[0].cvFileName, 'ada.pdf');
  assert.equal(state.associations[0].keywordMatchScore, 70);
  assert.deepEqual(state.associations[0].keywordMatchBreakdown, keywordMatchBreakdown);
  assert.equal(state.associations[0].aiMatchStatus, undefined);
  assert.equal(state.associations[0].aiMatchScore, undefined);
});

test('rejects duplicate email only when it is already associated with the same vacancy', async () => {
  const { service, state } = createFixture();
  await service.uploadCvs(
    user,
    'vacancy-1',
    upload([{ fileName: 'ada.pdf', email: 'ada@example.com', extractedText: 'Ada CV' }]),
  );
  const duplicate = await service.uploadCvs(
    user,
    'vacancy-1',
    upload([{ fileName: 'ada-new.pdf', email: 'ADA@example.com', extractedText: 'Ada CV' }]),
  );
  const otherVacancy = await service.uploadCvs(
    user,
    'vacancy-2',
    upload([
      { fileName: 'ada-vacancy-two.pdf', email: 'ada@example.com', extractedText: 'Ada CV' },
    ]),
  );

  assert.deepEqual(duplicate.items, [
    {
      fileName: 'ada-new.pdf',
      message: 'Candidate already exists for this vacancy.',
      status: 'DUPLICATE',
    },
  ]);
  assert.equal(otherVacancy.items[0].status, 'CREATED');
  assert.equal(state.candidates.length, 2);
});

test('includes only the current vacancy interview session in candidate list results', async () => {
  let findManyArguments;
  const listedCandidate = {
    id: 'association-1',
    candidateId: 'candidate-1',
    vacancyId: 'vacancy-1',
    createdAt: new Date('2026-09-12T10:00:00.000Z'),
    candidate: {
      id: 'candidate-1',
      sessions: [
        {
          evaluationStatus: 'EVALUATED',
          evaluatedAt: new Date('2026-09-12T12:00:00.000Z'),
          invitationId: 'interview-invitation-1',
          overallScore: { toString: () => '84' },
        },
      ],
    },
  };
  const prisma = {
    vacancyCandidate: {
      async count() {
        return 1;
      },
      async findMany(arguments_) {
        findManyArguments = arguments_;
        return [listedCandidate];
      },
    },
    async $transaction(operations) {
      return Promise.all(operations);
    },
  };
  const service = new VacancyCandidateService(prisma, { async findOne() {} }, {});

  const result = await service.findAll(user, 'vacancy-1', {});

  assert.equal(result.items[0].candidate.sessions[0].invitationId, 'interview-invitation-1');
  assert.equal(result.items[0].candidate.sessions[0].evaluationStatus, 'EVALUATED');
  assert.deepEqual(findManyArguments.include.candidate.select.sessions.where, {
    vacancyId: 'vacancy-1',
  });
  assert.deepEqual(findManyArguments.include.candidate.select.invitations.where, {
    vacancyId: 'vacancy-1',
  });
  assert.deepEqual(findManyArguments.include.candidate.select.sessions.select, {
    evaluationStatus: true,
    evaluatedAt: true,
    invitationId: true,
    overallScore: true,
    status: true,
  });
  assert.equal(findManyArguments.include.candidate.select.sessions.take, 1);
});

test('sorts completed AI interview scores while keeping unevaluated candidates last', async () => {
  const candidates = [
    candidateForInterviewScore('association-1', 'EVALUATED', '72'),
    candidateForInterviewScore('association-2', 'EVALUATING', null),
    candidateForInterviewScore('association-3', 'EVALUATED', '84'),
  ];
  const prisma = {
    vacancyCandidate: {
      async count() {
        return candidates.length;
      },
      async findMany() {
        return candidates;
      },
    },
    async $transaction(operations) {
      return Promise.all(operations);
    },
  };
  const service = new VacancyCandidateService(prisma, { async findOne() {} }, {});

  const result = await service.findAll(user, 'vacancy-1', {
    sortBy: 'aiInterviewScore',
    sortDirection: 'desc',
  });

  assert.deepEqual(
    result.items.map((candidate) => candidate.id),
    ['association-3', 'association-1', 'association-2'],
  );
});

function candidateForInterviewScore(id, evaluationStatus, overallScore) {
  return {
    id,
    candidateId: `${id}-candidate`,
    createdAt: new Date('2026-09-12T10:00:00.000Z'),
    vacancyId: 'vacancy-1',
    candidate: {
      id: `${id}-candidate`,
      sessions: [
        {
          evaluationStatus,
          evaluatedAt:
            evaluationStatus === 'EVALUATED' ? new Date('2026-09-12T12:00:00.000Z') : null,
          invitationId: `${id}-interview`,
          overallScore: overallScore === null ? null : { toString: () => overallScore },
          status: 'COMPLETED',
        },
      ],
    },
  };
}

test('marks only later duplicate emails in a bulk request as duplicates', async () => {
  const { service, state } = createFixture();
  const result = await service.uploadCvs(
    user,
    'vacancy-1',
    upload([
      { fileName: 'ada.pdf', email: 'ada@example.com', extractedText: 'Ada CV' },
      { fileName: 'ada-copy.pdf', email: 'ada@example.com', extractedText: 'Ada CV copy' },
      { fileName: 'grace.pdf', email: 'grace@example.com', extractedText: 'Grace CV' },
    ]),
  );

  assert.deepEqual(
    result.items.map((item) => item.status),
    ['CREATED', 'DUPLICATE', 'CREATED'],
  );
  assert.equal(state.candidates.length, 2);
  assert.equal(state.associations.length, 2);
});

function aiMatchResult(overrides = {}) {
  return {
    extractedData: {
      candidate: {
        fullName: 'Ada Lovelace',
        email: 'ada.other@example.com',
        phone: '+94111234567',
        location: null,
        linkedInUrl: null,
        portfolioUrl: null,
      },
      summary: 'Backend engineer.',
      skills: [{ name: 'Node.js', category: null, yearsOfExperience: 4 }],
      workExperience: [],
      education: [],
      certifications: [],
    },
    gaps: ['The CV does not demonstrate AWS experience.'],
    preferredTechnologiesMet: [],
    requiredTechnologiesMet: ['Node.js'],
    score: 82,
    strengths: ['The CV demonstrates Node.js experience.'],
    summary: 'Relevant backend experience.',
    vacancyMatchScore: 70,
    ...overrides,
  };
}

function createAiMatchFixture({ candidateEmail = 'ada@example.com', otherEmails = [] } = {}) {
  const state = {
    association: {
      id: 'association-1',
      vacancyId: 'vacancy-1',
      aiMatchStatus: 'NOT_REQUESTED',
      decision: 'KEEP_IN_REVIEW',
      notes: 'HR note',
    },
    candidate: {
      id: 'candidate-1',
      name: candidateEmail ?? '2026-09-28 10:00:00 UTC',
      email: candidateEmail,
      phone: '',
      processingStatus: 'READY',
      cvExtractedText: 'Ada Lovelace. Node.js engineer.',
    },
  };
  const matchesWhere = (where) =>
    (typeof where.id === 'string'
      ? where.id === state.association.id
      : where.id.in.includes(state.association.id)) &&
    (where.aiMatchStatus === undefined ||
      (typeof where.aiMatchStatus === 'string'
        ? where.aiMatchStatus === state.association.aiMatchStatus
        : where.aiMatchStatus.in.includes(state.association.aiMatchStatus)));
  const prisma = {
    vacancyCandidate: {
      async findMany({ where }) {
        if (where.aiMatchStatus !== undefined) {
          return state.association.aiMatchStatus === where.aiMatchStatus
            ? [{ id: state.association.id }]
            : [];
        }
        return [
          {
            id: state.association.id,
            candidate: { processingStatus: state.candidate.processingStatus },
          },
        ];
      },
      async updateMany({ where, data }) {
        if (!matchesWhere(where)) return { count: 0 };
        Object.assign(state.association, data);
        return { count: 1 };
      },
      async findUnique() {
        return { candidate: state.candidate };
      },
      async findUniqueOrThrow() {
        return { candidate: state.candidate, vacancyId: state.association.vacancyId };
      },
    },
    candidate: {
      async update({ data }) {
        Object.assign(state.candidate, data);
        return state.candidate;
      },
      async findFirst({ where }) {
        return otherEmails.includes(where.email) ? { id: 'candidate-2' } : null;
      },
    },
    async $executeRaw() {
      return 1;
    },
    async $transaction(operation) {
      return operation(this);
    },
  };
  const service = new VacancyCandidateService(prisma, { async findOne() {} }, {});
  return { service, state };
}

test('loads the uploaded CV text for the AI match and rejects candidates without it', async () => {
  const { service, state } = createAiMatchFixture();
  assert.equal(
    await service.getCvTextForAiMatch('association-1'),
    'Ada Lovelace. Node.js engineer.',
  );

  state.candidate.cvExtractedText = null;
  await assert.rejects(service.getCvTextForAiMatch('association-1'), { status: 409 });
});

test('persists the extracted name, CV data and AI match fields without an HR decision', async () => {
  const { service, state } = createAiMatchFixture();
  await service.queueAiMatches(user, 'vacancy-1', ['association-1']);
  assert.equal(state.association.aiMatchStatus, 'QUEUED');
  assert.equal(await service.claimAiMatch('association-1'), true);

  const result = aiMatchResult();
  await service.completeAiMatch('association-1', result);

  assert.equal(state.candidate.name, 'Ada Lovelace');
  assert.equal(state.candidate.phone, '+94111234567');
  assert.deepEqual(state.candidate.cvExtractedData, result.extractedData);
  // The browser-extracted email stays authoritative over the AI-extracted one.
  assert.equal(state.candidate.email, 'ada@example.com');
  assert.equal(state.association.aiMatchStatus, 'COMPLETED');
  assert.equal(state.association.aiMatchScore, 82);
  assert.equal(state.association.summary, 'Relevant backend experience.');
  assert.deepEqual(state.association.strengths, result.strengths);
  assert.deepEqual(state.association.gaps, result.gaps);
  assert.deepEqual(state.association.requiredTechnologiesMet, ['Node.js']);
  assert.deepEqual(state.association.preferredTechnologiesMet, []);
  assert.equal(state.association.vacancyMatchScore, 70);
  assert.equal(state.association.decision, 'KEEP_IN_REVIEW');
  assert.equal(state.association.notes, 'HR note');
});

test('recalculation re-queues a completed match and replaces the same row result', async () => {
  const { service, state } = createAiMatchFixture();
  await service.queueAiMatches(user, 'vacancy-1', ['association-1']);
  await service.claimAiMatch('association-1');
  await service.completeAiMatch('association-1', aiMatchResult());

  const queued = await service.queueAiMatches(user, 'vacancy-1', ['association-1']);
  assert.deepEqual(queued, ['association-1']);
  await service.claimAiMatch('association-1');
  await service.completeAiMatch('association-1', aiMatchResult({ score: 64, summary: 'Updated.' }));

  assert.equal(state.association.id, 'association-1');
  assert.equal(state.association.aiMatchScore, 64);
  assert.equal(state.association.summary, 'Updated.');
});

test('does not re-queue or complete a match that is not claimed', async () => {
  const { service, state } = createAiMatchFixture();
  state.association.aiMatchStatus = 'PROCESSING';
  assert.deepEqual(await service.queueAiMatches(user, 'vacancy-1', ['association-1']), []);

  state.association.aiMatchStatus = 'QUEUED';
  await service.completeAiMatch('association-1', aiMatchResult());
  assert.equal(state.candidate.name, 'ada@example.com');
  assert.equal(state.association.aiMatchScore, undefined);
});

test('marks a claimed match failed without touching the candidate', async () => {
  const { service, state } = createAiMatchFixture();
  state.association.aiMatchStatus = 'PROCESSING';
  await service.failAiMatch('association-1');

  assert.equal(state.association.aiMatchStatus, 'FAILED');
  assert.equal(state.association.aiMatchError, 'We could not calculate the AI match score.');
  assert.equal(state.candidate.name, 'ada@example.com');
});

test('adopts an AI-extracted email only when the upload had none and it is unused', async () => {
  const withoutEmail = createAiMatchFixture({ candidateEmail: null });
  withoutEmail.state.association.aiMatchStatus = 'PROCESSING';
  await withoutEmail.service.completeAiMatch('association-1', aiMatchResult());
  assert.equal(withoutEmail.state.candidate.email, 'ada.other@example.com');

  const takenEmail = createAiMatchFixture({
    candidateEmail: null,
    otherEmails: ['ada.other@example.com'],
  });
  takenEmail.state.association.aiMatchStatus = 'PROCESSING';
  await takenEmail.service.completeAiMatch('association-1', aiMatchResult());
  assert.equal(takenEmail.state.candidate.email, null);
  assert.equal(takenEmail.state.candidate.name, 'Ada Lovelace');
});

test('names a CV uploaded without an email after its upload date and time', async () => {
  const { service, state } = createFixture();
  const before = Date.now();
  await service.uploadCvs(user, 'vacancy-1', upload([{ fileName: 'cv.pdf', extractedText: 'CV' }]));

  const name = state.candidates[0].name;
  assert.match(name, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/);
  assert.ok(Date.parse(`${name.replace(' UTC', '')}Z`) >= Math.floor(before / 1000) * 1000);
  assert.equal(state.candidates[0].email, undefined);
  assert.equal(
    toUploadTimestampName(new Date('2026-09-28T14:05:31.789Z')),
    '2026-09-28 14:05:31 UTC',
  );
});
