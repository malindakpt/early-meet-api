import assert from 'node:assert/strict';
import test from 'node:test';
import { InterviewFollowUpService } from '../dist/api-modules/interviews/interview-follow-up.service.js';

const user = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const otherOrganizationUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function createFixture({ allowFollowUp = true, decision, llmError } = {}) {
  const state = {
    answers: [
      {
        id: 'core-answer-1',
        interviewSessionId: 'session-1',
        vacancyQuestionId: 'vacancy-question-1',
        followUpFromId: null,
        sequence: 1,
        status: 'ANSWERED',
        questionText: 'Explain dependency injection.',
        answerText: 'Use a composition root to provide dependencies.',
        score: 65,
        explanation: 'The answer is correct but does not explain testability.',
        interviewSession: { status: 'IN_PROGRESS' },
        vacancyQuestion: {
          followUpAllowed: allowFollowUp,
          evaluationCriteria: { expected: 'composition root and testability' },
        },
        followUps: [],
      },
      {
        id: 'core-answer-2',
        interviewSessionId: 'session-1',
        vacancyQuestionId: 'vacancy-question-2',
        followUpFromId: null,
        sequence: 2,
        status: 'PENDING',
        questionText: 'Explain transaction boundaries.',
        answerText: null,
        score: null,
        explanation: null,
      },
    ],
    invitation: { id: 'interview-1', status: 'OPENED' },
    logs: [],
    nextId: 1,
    session: {
      id: 'session-1',
      invitationId: 'interview-1',
      vacancyId: 'vacancy-1',
      candidateId: 'candidate-1',
      status: 'IN_PROGRESS',
    },
    inputs: [],
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
      return { candidateId: 'candidate-1' };
    },
  };
  const matches = (answer, where) =>
    (where.id === undefined || answer.id === where.id) &&
    (where.interviewSessionId === undefined ||
      answer.interviewSessionId === where.interviewSessionId) &&
    (where.followUpFromId === undefined || answer.followUpFromId === where.followUpFromId) &&
    (where.status === undefined || answer.status === where.status);
  const interviewQuestionAnswer = {
    async findFirst({ where, orderBy }) {
      const candidates = state.answers.filter((answer) => matches(answer, where));
      if (where.interviewSession !== undefined) {
        if (
          (where.interviewSession.invitationId !== undefined &&
            where.interviewSession.invitationId !== state.session.invitationId) ||
          (where.interviewSession.vacancyId !== undefined &&
            where.interviewSession.vacancyId !== state.session.vacancyId) ||
          (where.interviewSession.candidateId !== undefined &&
            where.interviewSession.candidateId !== state.session.candidateId)
        ) {
          return null;
        }
      }
      if (orderBy?.sequence === 'asc') {
        candidates.sort((left, right) => left.sequence - right.sequence);
      }
      return candidates[0] ?? null;
    },
    async create({ data }) {
      const followUp = {
        id: `follow-up-${state.nextId++}`,
        vacancyQuestionId: null,
        answerText: null,
        answeredAt: null,
        score: null,
        explanation: null,
        ...data,
      };
      state.answers.push(followUp);
      state.answers[0].followUps.push({ id: followUp.id });
      return followUp;
    },
    async update({ where, data }) {
      const answer = state.answers.find((item) => item.id === where.id);
      Object.assign(answer, data);
      return answer;
    },
  };
  const interviewSession = {
    async findFirst({ where }) {
      return where.invitationId === 'interview-1' &&
        where.vacancyId === 'vacancy-1' &&
        where.candidateId === 'candidate-1'
        ? state.session
        : null;
    },
    async update({ data }) {
      Object.assign(state.session, data);
      return state.session;
    },
  };
  const interviewInvitation = {
    async update({ data }) {
      Object.assign(state.invitation, data);
      return state.invitation;
    },
  };
  const prisma = {
    interviewQuestionAnswer,
    interviewSession,
    interviewInvitation,
    async $transaction(work) {
      return work({ interviewQuestionAnswer, interviewSession, interviewInvitation });
    },
  };
  const followUpLlmService = {
    async decide(input) {
      state.inputs.push(input);
      if (llmError !== undefined) {
        throw llmError;
      }
      return (
        decision ?? {
          shouldFollowUp: true,
          reason: 'Testability was not explained.',
          followUpQuestion: 'How does dependency injection improve testability?',
        }
      );
    },
  };
  return {
    service: new InterviewFollowUpService(followUpLlmService, prisma, vacancyCandidateService, {
      error(message, context) {
        state.logs.push({ message, context });
      },
      log(message, context) {
        state.logs.push({ message, context });
      },
    }),
    state,
  };
}

test('does not call the LLM when follow-ups are disabled and instead resumes the next core question', async () => {
  const { service, state } = createFixture({ allowFollowUp: false });
  const response = await service.decide(
    user,
    'vacancy-1',
    'vacancy-candidate-1',
    'interview-1',
    'core-answer-1',
  );

  assert.deepEqual(response, {
    shouldFollowUp: false,
    reason: 'Follow-ups are disabled for this core question.',
    followUpQuestion: null,
  });
  assert.equal(state.inputs.length, 0);
  assert.equal(state.answers[1].status, 'ASKED');
  assert.equal(state.answers.length, 2);
  await assert.rejects(
    service.decide(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1', 'core-answer-1'),
    { status: 409 },
  );
  assert.equal(state.inputs.length, 0);
});

test('uses only the core question, criteria, answer, and evaluation to create one interview-specific follow-up', async () => {
  const { service, state } = createFixture();
  const response = await service.decide(
    user,
    'vacancy-1',
    'vacancy-candidate-1',
    'interview-1',
    'core-answer-1',
  );

  assert.deepEqual(state.inputs, [
    {
      question: {
        questionText: 'Explain dependency injection.',
        evaluationCriteria: { expected: 'composition root and testability' },
      },
      answer: {
        text: 'Use a composition root to provide dependencies.',
        evaluation: {
          score: 65,
          explanation: 'The answer is correct but does not explain testability.',
        },
      },
    },
  ]);
  assert.equal(response.shouldFollowUp, true);
  assert.equal(response.followUpQuestion.id, 'follow-up-1');
  assert.equal(state.answers[2].followUpFromId, 'core-answer-1');
  assert.equal(state.answers[2].vacancyQuestionId, null);
  assert.equal(state.answers[2].status, 'ASKED');
  assert.equal(state.answers[1].status, 'PENDING');
  assert.equal(JSON.stringify(state.inputs[0]).includes('candidate-2'), false);
  await assert.rejects(
    service.decide(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1', 'core-answer-1'),
    { status: 409 },
  );
});

test('continues without a follow-up for a negative decision or provider failure and scopes the core answer', async () => {
  const noFollowUp = createFixture({
    decision: {
      shouldFollowUp: false,
      reason: 'The answer is sufficiently complete.',
      followUpQuestion: null,
    },
  });
  const response = await noFollowUp.service.decide(
    user,
    'vacancy-1',
    'vacancy-candidate-1',
    'interview-1',
    'core-answer-1',
  );
  assert.equal(response.shouldFollowUp, false);
  assert.equal(noFollowUp.state.answers[1].status, 'ASKED');

  const failure = createFixture({ llmError: new Error('provider') });
  const failedResponse = await failure.service.decide(
    user,
    'vacancy-1',
    'vacancy-candidate-1',
    'interview-1',
    'core-answer-1',
  );
  assert.equal(failedResponse.shouldFollowUp, false);
  assert.equal(failure.state.answers.length, 2);
  assert.equal(
    failure.state.answers[0].answerText,
    'Use a composition root to provide dependencies.',
  );
  assert.equal(failure.state.answers[1].status, 'ASKED');

  await assert.rejects(
    noFollowUp.service.decide(
      otherOrganizationUser,
      'vacancy-1',
      'vacancy-candidate-1',
      'interview-1',
      'core-answer-1',
    ),
    { status: 404 },
  );
});
