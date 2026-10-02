import assert from 'node:assert/strict';
import test from 'node:test';

import { InterviewAnswerEvaluationService } from '../dist/api-modules/interviews/interview-answer-evaluation.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function createFixture({ llmError, evaluated = false } = {}) {
  const state = {
    answers: new Map([
      [
        'answer-1',
        {
          id: 'answer-1',
          interviewSessionId: 'session-1',
          vacancyQuestionId: 'vacancy-question-1',
          status: 'ANSWERED',
          questionText: 'Explain dependency injection.',
          answerText: 'Use a composition root to provide dependencies.',
          score: evaluated ? 82 : null,
          explanation: evaluated ? 'Already evaluated.' : null,
          vacancyQuestion: {
            difficulty: 'ADVANCED',
            questionType: 'OPEN_ENDED',
            evaluationCriteria: { expected: 'composition root and explicit dependencies' },
          },
        },
      ],
      [
        'answer-other-interview',
        {
          id: 'answer-other-interview',
          interviewSessionId: 'session-2',
          vacancyQuestionId: 'vacancy-question-1',
          status: 'ANSWERED',
          questionText: 'Explain dependency injection.',
          answerText: 'Other candidate answer.',
          score: null,
          explanation: null,
          vacancyQuestion: {
            difficulty: 'ADVANCED',
            questionType: 'OPEN_ENDED',
            evaluationCriteria: { expected: 'composition root and explicit dependencies' },
          },
        },
      ],
    ]),
    inputs: [],
    logs: [],
    updates: [],
  };
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const vacancyCandidateService = {
    async findOne(user, vacancyId, vacancyCandidateId) {
      if (
        user.organizationId !== 'organization-1' ||
        vacancyId !== 'vacancy-1' ||
        vacancyCandidateId !== 'vacancy-candidate-1'
      ) {
        throw notFound('Vacancy candidate not found.');
      }
      return { candidateId: 'candidate-1' };
    },
  };
  const evaluationLlmService = {
    async evaluate(input) {
      state.inputs.push(input);
      if (llmError !== undefined) {
        throw llmError;
      }
      return { score: 82, explanation: 'Correctly identifies composition-root dependency wiring.' };
    },
  };
  const prisma = {
    interviewQuestionAnswer: {
      async findFirst({ where }) {
        const answer = state.answers.get(where.id);
        return answer !== undefined &&
          where.status === answer.status &&
          where.interviewSession.invitationId === 'interview-1' &&
          where.interviewSession.vacancyId === 'vacancy-1' &&
          where.interviewSession.candidateId === 'candidate-1' &&
          answer.interviewSessionId === 'session-1'
          ? answer
          : null;
      },
      async updateMany({ where, data }) {
        const answer = state.answers.get(where.id);
        if (
          answer === undefined ||
          answer.score !== where.score ||
          answer.explanation !== where.explanation
        ) {
          return { count: 0 };
        }
        Object.assign(answer, data);
        state.updates.push({ where, data });
        return { count: 1 };
      },
    },
  };
  return {
    service: new InterviewAnswerEvaluationService(
      evaluationLlmService,
      prisma,
      vacancyCandidateService,
      {
        log(message, context) {
          state.logs.push({ message, context });
        },
      },
    ),
    state,
    evaluationLlmService,
  };
}

test('evaluates a scoped answered core question using only question criteria and answer content', async () => {
  const { service, state } = createFixture();
  const response = await service.evaluate(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    'interview-1',
    'answer-1',
  );

  assert.deepEqual(response, {
    answerId: 'answer-1',
    score: 82,
    explanation: 'Correctly identifies composition-root dependency wiring.',
  });
  assert.deepEqual(state.inputs, [
    {
      answerText: 'Use a composition root to provide dependencies.',
      question: {
        questionText: 'Explain dependency injection.',
        difficulty: 'ADVANCED',
        questionType: 'OPEN_ENDED',
        evaluationCriteria: { expected: 'composition root and explicit dependencies' },
      },
    },
  ]);
  assert.deepEqual(state.updates, [
    {
      where: { id: 'answer-1', score: null, explanation: null },
      data: { score: 82, explanation: 'Correctly identifies composition-root dependency wiring.' },
    },
  ]);
  assert.equal(JSON.stringify(state.inputs[0]).includes('Other candidate answer.'), false);
  assert.equal(JSON.stringify(state.logs).includes('composition root'), false);
});

test('rejects cross-organization, wrong vacancy candidate, and answers outside the interview scope', async () => {
  const { service, state } = createFixture();
  await assert.rejects(
    service.evaluate(
      organizationTwoUser,
      'vacancy-1',
      'vacancy-candidate-1',
      'interview-1',
      'answer-1',
    ),
    { status: 404 },
  );
  await assert.rejects(
    service.evaluate(
      organizationOneUser,
      'vacancy-1',
      'vacancy-candidate-2',
      'interview-1',
      'answer-1',
    ),
    { status: 404 },
  );
  await assert.rejects(
    service.evaluate(
      organizationOneUser,
      'vacancy-1',
      'vacancy-candidate-1',
      'interview-1',
      'answer-other-interview',
    ),
    { status: 404 },
  );
  assert.equal(state.inputs.length, 0);
});

test('prevents duplicate evaluation and leaves answers intact when the provider fails so it can be retried', async () => {
  const completed = createFixture({ evaluated: true });
  await assert.rejects(
    completed.service.evaluate(
      organizationOneUser,
      'vacancy-1',
      'vacancy-candidate-1',
      'interview-1',
      'answer-1',
    ),
    { status: 409 },
  );
  assert.equal(completed.state.inputs.length, 0);

  const failure = createFixture({ llmError: new Error('provider unavailable') });
  await assert.rejects(
    failure.service.evaluate(
      organizationOneUser,
      'vacancy-1',
      'vacancy-candidate-1',
      'interview-1',
      'answer-1',
    ),
  );
  assert.equal(failure.state.answers.get('answer-1').score, null);
  assert.equal(failure.state.answers.get('answer-1').explanation, null);
  failure.evaluationLlmService.evaluate = async (input) => {
    failure.state.inputs.push(input);
    return { score: 82, explanation: 'Correctly identifies composition-root dependency wiring.' };
  };
  await failure.service.evaluate(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    'interview-1',
    'answer-1',
  );
  assert.equal(failure.state.answers.get('answer-1').score, 82);
});
