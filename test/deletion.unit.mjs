import assert from 'node:assert/strict';
import test from 'node:test';

import { InterviewService } from '../dist/api-modules/interviews/interview.service.js';
import { VacancyCandidateService } from '../dist/api-modules/vacancy-candidates/vacancy-candidate.service.js';
import { VacancyService } from '../dist/api-modules/vacancies/vacancy.service.js';

const hr = { id: 'hr-1', organizationId: 'organization-1', role: 'HR' };
const otherHr = { id: 'hr-2', organizationId: 'organization-2', role: 'HR' };

test('removing a vacancy candidate cleans its interview data and preserves a shared Candidate', async () => {
  const calls = [];
  const association = { id: 'association-1', candidateId: 'candidate-1', vacancyId: 'vacancy-1' };
  const transaction = {
    interviewSession: {
      findMany: async () => [{ id: 'session-1' }],
      deleteMany: async () => calls.push('sessions'),
    },
    interviewQuestionAnswer: {
      updateMany: async () => calls.push('detach-follow-ups'),
      deleteMany: async () => calls.push('answers'),
    },
    interviewInvitation: { deleteMany: async () => calls.push('invitations') },
    vacancyCandidate: {
      delete: async () => calls.push('association'),
      count: async () => 1,
    },
    candidate: { delete: async () => calls.push('candidate') },
  };
  const prisma = {
    vacancyCandidate: { findFirst: async () => association },
    $transaction: async (operation) => operation(transaction),
  };
  const service = new VacancyCandidateService(prisma, { findOne: async () => ({}) }, {});

  await service.remove(hr, 'vacancy-1', 'association-1');

  assert.deepEqual(calls, [
    'detach-follow-ups',
    'answers',
    'sessions',
    'invitations',
    'association',
  ]);
});

test('removing an interview is organization-scoped and deletes its session answers before invitation', async () => {
  const calls = [];
  const transaction = {
    interviewSession: {
      findUnique: async () => ({ id: 'session-1' }),
      delete: async () => calls.push('session'),
    },
    interviewQuestionAnswer: {
      updateMany: async () => calls.push('detach-follow-ups'),
      deleteMany: async () => calls.push('answers'),
    },
    interviewInvitation: { delete: async () => calls.push('invitation') },
  };
  const prisma = {
    interviewInvitation: {
      findFirst: async ({ where }) =>
        where.vacancy.organizationId === 'organization-1' ? { id: 'interview-1' } : null,
    },
    $transaction: async (operation) => operation(transaction),
  };
  const service = new InterviewService(prisma, {}, {}, { send: async () => {} });

  await service.removeForReview(hr, 'interview-1');
  assert.deepEqual(calls, ['detach-follow-ups', 'answers', 'session', 'invitation']);
  await assert.rejects(service.removeForReview(otherHr, 'interview-1'), { status: 404 });
});

test('removing a vacancy deletes only vacancy-owned records and retains candidates used elsewhere', async () => {
  const calls = [];
  const transaction = {
    vacancyCandidate: {
      findMany: async () => [{ candidateId: 'shared-candidate' }],
      deleteMany: async () => calls.push('associations'),
      count: async () => 1,
    },
    interviewSession: {
      findMany: async () => [{ id: 'session-1' }],
      deleteMany: async () => calls.push('sessions'),
    },
    interviewQuestionAnswer: {
      updateMany: async () => calls.push('detach-follow-ups'),
      deleteMany: async () => calls.push('answers'),
    },
    interviewInvitation: { deleteMany: async () => calls.push('invitations') },
    vacancyQuestion: { deleteMany: async () => calls.push('vacancy-questions') },
    vacancyCustomQuestion: { deleteMany: async () => calls.push('custom-questions') },
    experienceCompetencyGeneration: {
      deleteMany: async () => calls.push('experience-generations'),
    },
    vacancyExperienceQuestion: { deleteMany: async () => calls.push('experience-questions') },
    vacancyExperienceArea: { deleteMany: async () => calls.push('experience-areas') },
    vacancyTechnology: { deleteMany: async () => calls.push('vacancy-technologies') },
    candidate: { delete: async () => calls.push('candidate') },
    vacancy: { delete: async () => calls.push('vacancy') },
  };
  const prisma = {
    vacancy: {
      findFirst: async ({ where }) =>
        where.organizationId === hr.organizationId ? { id: where.id } : null,
    },
    $transaction: async (operation) => operation(transaction),
  };
  const service = new VacancyService(prisma);

  await service.remove(hr, 'vacancy-1');

  assert.deepEqual(calls, [
    'detach-follow-ups',
    'answers',
    'sessions',
    'invitations',
    'vacancy-questions',
    'custom-questions',
    'experience-generations',
    'experience-questions',
    'experience-areas',
    'vacancy-technologies',
    'associations',
    'vacancy',
  ]);
  assert.equal(calls.includes('candidate'), false);
  await assert.rejects(service.remove(otherHr, 'vacancy-1'), { status: 404 });
});
