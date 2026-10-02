import assert from 'node:assert/strict';
import test from 'node:test';

import { CandidateRankingService } from '../dist/api-modules/vacancy-candidates/candidate-ranking.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function coreAnswer({ id, sequence, score, technology = 'TypeScript' }) {
  return {
    id,
    sequence,
    followUpFromId: null,
    status: 'ANSWERED',
    questionText: `Core question ${sequence}`,
    score,
    vacancyQuestionId: `vacancy-question-${sequence}`,
    vacancyQuestion: {
      question: {
        technology: technology === null ? null : { name: technology },
        technologySegment: { name: 'Fundamentals' },
      },
    },
  };
}

function evaluatedInvitation(id, candidateId, score, evaluatedAt = '2026-08-30T12:00:00.000Z') {
  return {
    id,
    candidateId,
    status: 'COMPLETED',
    createdAt: new Date(evaluatedAt),
    session: {
      id: `session-${id}`,
      status: 'COMPLETED',
      overallScore: score,
      candidateIntelligence: {
        preferredSkills: { coverage: 60 },
        requiredSkills: { coverage: 80 },
      },
      evaluationStatus: 'EVALUATED',
      summary: 'Persisted evaluation.',
      evaluatedAt: new Date(evaluatedAt),
      answers: [
        coreAnswer({ id: `${id}-core-1`, sequence: 1, score: score - 5 }),
        coreAnswer({ id: `${id}-core-2`, sequence: 2, score: score + 5, technology: 'PostgreSQL' }),
      ],
    },
  };
}

function createFixture() {
  const candidates = [
    {
      id: 'association-a',
      candidateId: 'candidate-a',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-a',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        invitations: [evaluatedInvitation('interview-a', 'candidate-a', 83)],
      },
    },
    {
      id: 'association-b',
      candidateId: 'candidate-b',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-b',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        invitations: [evaluatedInvitation('interview-b', 'candidate-b', 95)],
      },
    },
    {
      id: 'association-c',
      candidateId: 'candidate-c',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-c',
        name: 'Linus Torvalds',
        email: 'linus@example.com',
        invitations: [evaluatedInvitation('interview-c', 'candidate-c', 83)],
      },
    },
    {
      id: 'association-incomplete',
      candidateId: 'candidate-incomplete',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-incomplete',
        name: 'Pending Candidate',
        email: 'pending@example.com',
        invitations: [
          {
            id: 'interview-incomplete',
            candidateId: 'candidate-incomplete',
            status: 'OPENED',
            createdAt: new Date('2026-08-30T12:00:00.000Z'),
            session: {
              status: 'IN_PROGRESS',
              evaluationStatus: 'NOT_STARTED',
              overallScore: null,
              summary: null,
              evaluatedAt: null,
              answers: [],
            },
          },
        ],
      },
    },
    {
      id: 'association-pending-evaluation',
      candidateId: 'candidate-pending',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-pending',
        name: 'Unscored Candidate',
        email: 'unscored@example.com',
        invitations: [
          {
            id: 'interview-pending',
            candidateId: 'candidate-pending',
            status: 'COMPLETED',
            createdAt: new Date('2026-08-30T12:00:00.000Z'),
            session: {
              status: 'COMPLETED',
              evaluationStatus: 'EVALUATING',
              overallScore: null,
              summary: null,
              evaluatedAt: null,
              answers: [],
            },
          },
        ],
      },
    },
    {
      id: 'association-not-started',
      candidateId: 'candidate-not-started',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-not-started',
        name: 'New Candidate',
        email: 'new@example.com',
        invitations: [],
      },
    },
    {
      id: 'association-failed-evaluation',
      candidateId: 'candidate-failed',
      vacancyId: 'vacancy-1',
      candidate: {
        id: 'candidate-failed',
        name: 'Failed Evaluation Candidate',
        email: 'failed@example.com',
        invitations: [
          {
            id: 'interview-failed',
            candidateId: 'candidate-failed',
            status: 'COMPLETED',
            createdAt: new Date('2026-08-30T12:00:00.000Z'),
            session: {
              status: 'COMPLETED',
              evaluationStatus: 'FAILED',
              overallScore: null,
              summary: null,
              evaluatedAt: null,
              answers: [],
            },
          },
        ],
      },
    },
    {
      id: 'association-other-vacancy',
      candidateId: 'candidate-other',
      vacancyId: 'vacancy-2',
      candidate: {
        id: 'candidate-other',
        name: 'Other Vacancy',
        email: 'other@example.com',
        invitations: [evaluatedInvitation('interview-other', 'candidate-other', 100)],
      },
    },
  ];
  const calls = [];
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const vacancyService = {
    async findOne(user, vacancyId) {
      if (user.organizationId !== 'organization-1' || vacancyId !== 'vacancy-1') {
        throw notFound('Vacancy not found.');
      }
      return { id: vacancyId };
    },
  };
  const prisma = {
    vacancyCandidate: {
      async findMany(options) {
        calls.push(options);
        return candidates.filter((candidate) => candidate.vacancyId === options.where.vacancyId);
      },
    },
  };
  return { service: new CandidateRankingService(prisma, vacancyService), calls };
}

test('ranks persisted overall scores descending with deterministic competition ranking and question evidence', async () => {
  const { service, calls } = createFixture();
  const response = await service.findAll(organizationOneUser, 'vacancy-1', { page: 1, limit: 25 });

  assert.deepEqual(
    response.rankedCandidates.map((candidate) => [
      candidate.candidateId,
      candidate.overallScore,
      candidate.rank,
    ]),
    [
      ['candidate-b', 95, 1],
      ['candidate-a', 83, 2],
      ['candidate-c', 83, 2],
    ],
  );
  assert.deepEqual(response.rankedCandidates[0].questionScores, [
    { questionId: 'vacancy-question-1', questionText: 'Core question 1', sequence: 1, score: 90 },
    { questionId: 'vacancy-question-2', questionText: 'Core question 2', sequence: 2, score: 100 },
  ]);
  assert.deepEqual(response.rankedCandidates[0].technologyScores, [
    { technology: 'PostgreSQL', averageScore: 100, evaluatedCoreQuestionCount: 1 },
    { technology: 'TypeScript', averageScore: 90, evaluatedCoreQuestionCount: 1 },
  ]);
  assert.deepEqual(response.pagination, { page: 1, limit: 25, total: 3, totalPages: 1 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].include.candidate.select.invitations.where.vacancyId, 'vacancy-1');
});

test('separates incomplete and unavailable evaluations from rankings without assigning scores', async () => {
  const { service } = createFixture();
  const response = await service.findAll(organizationOneUser, 'vacancy-1', {});

  assert.deepEqual(
    response.notEvaluatedCandidates.map((candidate) => [candidate.candidateId, candidate.reason]),
    [
      ['candidate-incomplete', 'INTERVIEW_INCOMPLETE'],
      ['candidate-pending', 'OVERALL_EVALUATION_PENDING'],
      ['candidate-not-started', 'INTERVIEW_NOT_STARTED'],
      ['candidate-failed', 'EVALUATION_FAILED'],
    ],
  );
  assert.equal(JSON.stringify(response).includes('candidate-other'), false);
  assert.equal(response.rankedCandidates[0].requiredSkillCoverage, 80);
  assert.equal(response.rankedCandidates[0].preferredSkillCoverage, 60);
});

test('paginates globally ranked candidates while retaining their global competition ranks and scopes vacancy access', async () => {
  const { service } = createFixture();
  const response = await service.findAll(organizationOneUser, 'vacancy-1', { page: 2, limit: 1 });

  assert.deepEqual(
    response.rankedCandidates.map((candidate) => [candidate.candidateId, candidate.rank]),
    [['candidate-a', 2]],
  );
  assert.deepEqual(response.pagination, { page: 2, limit: 1, total: 3, totalPages: 3 });
  await assert.rejects(service.findAll(organizationTwoUser, 'vacancy-1', {}), { status: 404 });
  await assert.rejects(service.findAll(organizationOneUser, 'vacancy-2', {}), { status: 404 });
});
