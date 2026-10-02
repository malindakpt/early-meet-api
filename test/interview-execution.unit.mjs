import assert from 'node:assert/strict';
import test from 'node:test';

import { InterviewService } from '../dist/api-modules/interviews/interview.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function createFixture() {
  const state = {
    answers: [],
    invitations: new Map(),
    nextAnswerId: 1,
    nextInvitationId: 1,
    nextSessionId: 1,
    sessions: new Map(),
    vacancy: { id: 'vacancy-1', title: 'Backend Engineer' },
    vacancyQuestions: [
      {
        id: 'vacancy-question-1',
        question: { estimatedAnswerTimeSeconds: 120 },
        vacancyId: 'vacancy-1',
        sequence: 1,
        questionText: 'Explain dependency injection.',
        evaluationCriteria: { expected: 'composition root' },
      },
      {
        id: 'vacancy-question-2',
        question: { estimatedAnswerTimeSeconds: 180 },
        vacancyId: 'vacancy-1',
        sequence: 2,
        questionText: 'Explain transactional consistency.',
        evaluationCriteria: { expected: 'atomicity' },
      },
    ],
    customQuestions: [],
  };
  const associations = new Map([
    [
      'vacancy-candidate-1',
      {
        id: 'vacancy-candidate-1',
        vacancyId: 'vacancy-1',
        candidateId: 'candidate-1',
        organizationId: 'organization-1',
        candidate: { status: 'ACTIVE', processingStatus: 'READY', email: 'ada@example.com' },
      },
    ],
    [
      'vacancy-candidate-2',
      {
        id: 'vacancy-candidate-2',
        vacancyId: 'vacancy-1',
        candidateId: 'candidate-2',
        organizationId: 'organization-1',
        candidate: { status: 'ACTIVE', processingStatus: 'READY', email: 'grace@example.com' },
      },
    ],
    [
      'vacancy-candidate-3',
      {
        id: 'vacancy-candidate-3',
        vacancyId: 'vacancy-2',
        candidateId: 'candidate-3',
        organizationId: 'organization-2',
        candidate: { status: 'ACTIVE', processingStatus: 'READY', email: 'linus@example.com' },
      },
    ],
  ]);
  state.associations = associations;
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const withRelations = (invitation) => ({
    ...invitation,
    candidate: {
      id: invitation.candidateId,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+94111234567',
      status: 'ACTIVE',
    },
    vacancy: { id: invitation.vacancyId, title: 'Backend Engineer', status: 'ACTIVE' },
  });
  const vacancyCandidateService = {
    async findOne(user, vacancyId, vacancyCandidateId) {
      const association = associations.get(vacancyCandidateId);
      if (
        association === undefined ||
        association.vacancyId !== vacancyId ||
        association.organizationId !== user.organizationId
      ) {
        throw notFound('Vacancy candidate not found.');
      }
      return association;
    },
  };
  const interviewInvitation = {
    async create({ data }) {
      const invitation = {
        id: `invitation-${state.nextInvitationId++}`,
        createdAt: new Date(),
        sentAt: null,
        updatedAt: new Date(),
        ...data,
      };
      state.invitations.set(invitation.id, invitation);
      return withRelations(invitation);
    },
    async findFirst({ where }) {
      const invitation = [...state.invitations.values()].find(
        (item) =>
          (where.id === undefined || item.id === where.id) &&
          (where.tokenHash === undefined || item.tokenHash === where.tokenHash) &&
          (where.vacancyId === undefined || item.vacancyId === where.vacancyId) &&
          (where.candidateId === undefined || item.candidateId === where.candidateId) &&
          (where.status?.in === undefined || where.status.in.includes(item.status)),
      );
      return invitation === undefined ? null : withRelations(invitation);
    },
    async update({ where, data }) {
      const invitation = state.invitations.get(where.id);
      Object.assign(invitation, data, { updatedAt: new Date() });
      return withRelations(invitation);
    },
    async delete({ where }) {
      state.invitations.delete(where.id);
    },
  };
  const interviewSession = {
    async findUnique({ where }) {
      return (
        [...state.sessions.values()].find(
          (session) => session.invitationId === where.invitationId,
        ) ?? null
      );
    },
    async findFirst({ where }) {
      return (
        [...state.sessions.values()].find(
          (session) =>
            session.invitationId === where.invitationId &&
            session.vacancyId === where.vacancyId &&
            session.candidateId === where.candidateId,
        ) ?? null
      );
    },
    async create({ data }) {
      const session = {
        id: `session-${state.nextSessionId++}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        overallScore: null,
        summary: null,
        recommendation: null,
        evaluatedAt: null,
        ...data,
      };
      delete session.answers;
      state.sessions.set(session.id, session);
      for (const answer of data.answers.create) {
        state.answers.push({
          id: `interview-question-${state.nextAnswerId++}`,
          interviewSessionId: session.id,
          followUpFromId: null,
          answerText: null,
          answeredAt: null,
          score: null,
          explanation: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...answer,
        });
      }
      return session;
    },
    async update({ where, data }) {
      const session = state.sessions.get(where.id);
      Object.assign(session, data, { updatedAt: new Date() });
      return session;
    },
  };
  const interviewQuestionAnswer = {
    async findFirst({ where, orderBy }) {
      const matches = state.answers.filter(
        (answer) =>
          (where.id === undefined || answer.id === where.id) &&
          (where.interviewSessionId === undefined ||
            answer.interviewSessionId === where.interviewSessionId) &&
          (where.status === undefined || answer.status === where.status),
      );
      if (orderBy?.sequence === 'asc') {
        matches.sort((left, right) => left.sequence - right.sequence);
      }
      return matches[0] ?? null;
    },
    async findMany({ where, orderBy }) {
      const matches = state.answers.filter(
        (answer) => answer.interviewSessionId === where.interviewSessionId,
      );
      if (orderBy?.sequence === 'asc') {
        matches.sort((left, right) => left.sequence - right.sequence);
      }
      return matches;
    },
    async update({ where, data }) {
      const answer = state.answers.find((item) => item.id === where.id);
      Object.assign(answer, data, { updatedAt: new Date() });
      return answer;
    },
  };
  const prisma = {
    interviewInvitation,
    interviewQuestionAnswer,
    interviewSession,
    vacancy: {
      async findUnique({ where }) {
        return where.id === state.vacancy.id ? state.vacancy : null;
      },
    },
    vacancyQuestion: {
      async findMany({ where }) {
        return state.vacancyQuestions
          .filter((question) => question.vacancyId === where.vacancyId)
          .sort((left, right) => left.sequence - right.sequence);
      },
      async count({ where }) {
        return state.vacancyQuestions.filter((question) => question.vacancyId === where.vacancyId)
          .length;
      },
    },
    vacancyCustomQuestion: {
      async findMany({ where }) {
        return state.customQuestions
          .filter((question) => question.vacancyId === where.vacancyId)
          .sort((left, right) => left.displayOrder - right.displayOrder);
      },
      async count({ where }) {
        return state.customQuestions.filter((question) => question.vacancyId === where.vacancyId)
          .length;
      },
    },
    async $transaction(work) {
      return work({ interviewInvitation, interviewQuestionAnswer, interviewSession });
    },
  };
  const authTokenService = {
    createOpaqueToken() {
      return 'opaque-invitation-token';
    },
    hashOpaqueToken(token) {
      return `hash:${token}`;
    },
  };
  const sentNotifications = [];
  const invitationNotificationService = {
    async send(notification) {
      sentNotifications.push(notification);
    },
  };
  return {
    service: new InterviewService(
      prisma,
      vacancyCandidateService,
      authTokenService,
      invitationNotificationService,
    ),
    sentNotifications,
    state,
  };
}

test('starts an authorized interview with immutable ordered core question snapshots', async () => {
  const { service, state } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const progress = await service.start(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
  );

  assert.equal(progress.status, 'IN_PROGRESS');
  assert.equal(progress.answeredQuestionCount, 0);
  assert.equal(progress.totalCoreQuestionCount, 2);
  assert.deepEqual(progress.currentQuestion, {
    id: 'interview-question-1',
    sequence: 1,
    questionText: 'Explain dependency injection.',
  });
  assert.equal('evaluationCriteria' in progress.currentQuestion, false);
  assert.equal(state.invitations.get(interview.id).status, 'OPENED');
  assert.deepEqual(
    state.answers.map(({ vacancyQuestionId, sequence, questionText }) => [
      vacancyQuestionId,
      sequence,
      questionText,
    ]),
    [
      ['vacancy-question-1', 1, 'Explain dependency injection.'],
      ['vacancy-question-2', 2, 'Explain transactional consistency.'],
    ],
  );
  state.vacancyQuestions[0].questionText = 'Changed after start.';
  assert.equal(state.answers[0].questionText, 'Explain dependency injection.');
});

test('appends every custom question to the same core questionnaire order', async () => {
  const { service, state } = createFixture();
  state.customQuestions.push({
    id: 'custom-question-1',
    vacancyId: 'vacancy-1',
    displayOrder: 1,
    questionText: 'Describe a difficult stakeholder decision.',
    evaluationCriteria: 'Assess ownership and communication.',
  });
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const progress = await service.start(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
  );

  assert.equal(progress.totalCoreQuestionCount, 3);
  assert.deepEqual(
    state.answers.map(({ vacancyQuestionId, vacancyCustomQuestionId, sequence }) => [
      vacancyQuestionId ?? null,
      vacancyCustomQuestionId ?? null,
      sequence,
    ]),
    [
      ['vacancy-question-1', null, 1],
      ['vacancy-question-2', null, 2],
      [null, 'custom-question-1', 3],
    ],
  );
});

test('rejects cross-organization, wrong vacancy-candidate, invalid-state, and duplicate starts', async () => {
  const { service } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  await assert.rejects(
    service.start(organizationTwoUser, 'vacancy-1', 'vacancy-candidate-1', interview.id),
    { status: 404 },
  );
  await assert.rejects(
    service.start(organizationOneUser, 'vacancy-1', 'vacancy-candidate-2', interview.id),
    { status: 404 },
  );
  await service.start(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', interview.id);
  await assert.rejects(
    service.start(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', interview.id),
    { status: 409 },
  );
});

test('persists only the current core answer and advances to the next core question', async () => {
  const { service, state } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const started = await service.start(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
  );
  const secondQuestion = state.answers[1];
  await assert.rejects(
    service.submitAnswer(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', interview.id, {
      interviewQuestionId: secondQuestion.id,
      answerText: 'Out of order.',
    }),
    { status: 409 },
  );
  const afterFirst = await service.submitAnswer(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
    { interviewQuestionId: started.currentQuestion.id, answerText: 'Use a composition root.' },
  );
  assert.equal(state.answers[0].answerText, 'Use a composition root.');
  assert.equal(state.answers[0].status, 'ANSWERED');
  assert.equal(afterFirst.currentQuestion.id, secondQuestion.id);
  assert.equal(state.answers[1].status, 'ASKED');
  await assert.rejects(
    service.submitAnswer(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', interview.id, {
      interviewQuestionId: started.currentQuestion.id,
      answerText: 'Duplicate.',
    }),
    { status: 409 },
  );
  assert.equal(afterFirst.answeredQuestionCount, 1);
});

test('completes the interview after its last core answer', async () => {
  const { service } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const started = await service.start(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
  );
  const afterFirst = await service.submitAnswer(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
    { interviewQuestionId: started.currentQuestion.id, answerText: 'Use a composition root.' },
  );
  const progress = await service.submitAnswer(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    interview.id,
    {
      interviewQuestionId: afterFirst.currentQuestion.id,
      answerText: 'A transaction commits all related changes atomically.',
    },
  );
  assert.equal(progress.isComplete, true);
  assert.equal(progress.currentQuestion, null);
  assert.equal(progress.status, 'COMPLETED');
});

test('uses the same ordered core question set for separate candidates in the same vacancy', async () => {
  const { service, state } = createFixture();
  const firstInterview = await service.create(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
  );
  const secondInterview = await service.create(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-2',
  );
  await service.start(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', firstInterview.id);
  await service.start(organizationOneUser, 'vacancy-1', 'vacancy-candidate-2', secondInterview.id);

  const firstSession = [...state.sessions.values()].find(
    (session) => session.invitationId === firstInterview.id,
  );
  const secondSession = [...state.sessions.values()].find(
    (session) => session.invitationId === secondInterview.id,
  );
  const snapshot = (sessionId) =>
    state.answers
      .filter((answer) => answer.interviewSessionId === sessionId)
      .sort((left, right) => left.sequence - right.sequence)
      .map(({ sequence, questionText }) => [sequence, questionText]);
  assert.deepEqual(snapshot(firstSession.id), snapshot(secondSession.id));
});

test('restores candidate progress exclusively from a valid opaque token', async () => {
  const { service } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  const notStarted = await service.getCandidateProgress(interview.token);
  assert.equal(notStarted.status, 'NOT_STARTED');
  assert.equal(notStarted.currentQuestion, null);
  assert.equal(notStarted.estimatedInterviewTimeSeconds, 300);
  assert.equal(notStarted.vacancyTitle, 'Backend Engineer');

  await service.startCandidateInterview(interview.token);
  const inProgress = await service.getCandidateProgress(interview.token);
  assert.equal(inProgress.status, 'IN_PROGRESS');
  assert.equal(inProgress.currentQuestion.sequence, 1);
  await assert.rejects(service.getCandidateProgress('invalid-token'), { status: 404 });
});

test('submits candidate answers once and progresses through the authoritative core order', async () => {
  const { service } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const started = await service.startCandidateInterview(interview.token);
  const afterFirst = await service.submitCandidateAnswer(interview.token, {
    interviewQuestionId: started.currentQuestion.id,
    answerText: 'Use a composition root.',
  });

  assert.equal(afterFirst.currentQuestion.sequence, 2);
  await assert.rejects(
    service.submitCandidateAnswer(interview.token, {
      interviewQuestionId: started.currentQuestion.id,
      answerText: 'Duplicate answer.',
    }),
    { status: 409 },
  );
  const completed = await service.submitCandidateAnswer(interview.token, {
    interviewQuestionId: afterFirst.currentQuestion.id,
    answerText: 'Commit all related changes atomically.',
  });
  assert.equal(completed.isComplete, true);
  assert.equal((await service.getCandidateProgress(interview.token)).status, 'COMPLETED');
});

test('rejects expired candidate interview tokens', async () => {
  const { service, state } = createFixture();
  const interview = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  state.invitations.get(interview.id).expiresAt = new Date(Date.now() - 1);

  await assert.rejects(service.getCandidateProgress(interview.token), { status: 410 });
});

test('sends a secure invitation only after enforcing invitation eligibility', async () => {
  const { service, sentNotifications, state } = createFixture();
  const invitation = await service.sendInvitation(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
  );

  assert.equal(invitation.status, 'SENT');
  assert.ok(invitation.sentAt instanceof Date);
  assert.equal('token' in invitation, false);
  assert.deepEqual(sentNotifications, [
    {
      candidateEmail: 'ada@example.com',
      candidateName: 'Ada Lovelace',
      estimatedInterviewTimeSeconds: 300,
      token: 'opaque-invitation-token',
      vacancyTitle: 'Backend Engineer',
    },
  ]);
  assert.equal(state.invitations.get(invitation.id).tokenHash, 'hash:opaque-invitation-token');
  const started = await service.startCandidateInterview('opaque-invitation-token');
  assert.equal(started.status, 'IN_PROGRESS');
  assert.equal(state.invitations.get(invitation.id).status, 'OPENED');
  await assert.rejects(
    service.sendInvitation(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1'),
    { status: 409 },
  );
});

test('rejects invitation sends for unprocessed CVs and other organizations', async () => {
  const { service, state } = createFixture();
  state.associations.get('vacancy-candidate-1').candidate.processingStatus = 'AI_PROCESSING';
  await assert.rejects(
    service.sendInvitation(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1'),
    { status: 409 },
  );
  state.associations.get('vacancy-candidate-1').candidate.processingStatus = 'READY';
  await assert.rejects(
    service.sendInvitation(organizationTwoUser, 'vacancy-1', 'vacancy-candidate-1'),
    { status: 404 },
  );
});

test('removes a pending invitation when email delivery fails', async () => {
  const { service, state } = createFixture();
  service.invitationNotificationService.send = async () => {
    throw new Error('SMTP unavailable');
  };

  await assert.rejects(
    service.sendInvitation(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1'),
    /SMTP unavailable/,
  );
  assert.equal(state.invitations.size, 0);
});
