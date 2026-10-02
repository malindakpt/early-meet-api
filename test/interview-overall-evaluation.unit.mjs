import assert from 'node:assert/strict';
import test from 'node:test';

import { InterviewOverallEvaluationService } from '../dist/api-modules/interviews/interview-overall-evaluation.service.js';

const user = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const ids = {
  coreOne: '00000000-0000-4000-8000-000000000001',
  coreTwo: '00000000-0000-4000-8000-000000000002',
  followUp: '00000000-0000-4000-8000-000000000003',
  preferred: '00000000-0000-4000-8000-000000000004',
  required: '00000000-0000-4000-8000-000000000005',
};

function createFixture({ evaluation, providerError, status = 'COMPLETED' } = {}) {
  const state = {
    inputs: [],
    session: {
      id: 'session-1',
      invitationId: 'interview-1',
      candidateId: 'candidate-1',
      vacancyId: 'vacancy-1',
      status,
      evaluationStatus: 'NOT_STARTED',
      evaluationStartedAt: null,
      candidateIntelligence: null,
      overallScore: null,
      summary: null,
      evaluatedAt: null,
      vacancy: {
        title: 'Backend Engineer',
        jobDescription: 'Build dependable APIs.',
        interviewType: 'TECHNICAL',
        difficulty: 'ADVANCED',
        technologies: [
          {
            id: ids.required,
            requirementType: 'REQUIRED',
            segmentSelections: ['Architecture'],
            technology: { name: 'TypeScript' },
            technologySegment: { name: 'Architecture' },
          },
          {
            id: ids.preferred,
            requirementType: 'PREFERRED',
            segmentSelections: ['Performance'],
            technology: { name: 'PostgreSQL' },
            technologySegment: { name: 'Performance' },
          },
        ],
      },
      answers: [
        {
          id: ids.coreOne,
          sequence: 1,
          followUpFromId: null,
          status: 'ANSWERED',
          questionText: 'Explain dependency injection.',
          answerText: 'Use a composition root.',
          vacancyQuestion: {
            difficulty: 'ADVANCED',
            evaluationCriteria: { expected: 'composition root' },
            questionType: 'OPEN_ENDED',
            question: {
              technology: { name: 'TypeScript' },
              technologySegment: { name: 'Architecture' },
            },
          },
          followUpFrom: null,
        },
        {
          id: ids.coreTwo,
          sequence: 2,
          followUpFromId: null,
          status: 'ANSWERED',
          questionText: 'Explain transaction isolation.',
          answerText: 'Transactions provide atomic boundaries.',
          vacancyQuestion: {
            difficulty: 'ADVANCED',
            evaluationCriteria: { expected: 'isolation' },
            questionType: 'OPEN_ENDED',
            question: {
              technology: { name: 'PostgreSQL' },
              technologySegment: { name: 'Performance' },
            },
          },
          followUpFrom: null,
        },
        {
          id: ids.followUp,
          sequence: 1,
          followUpFromId: ids.coreOne,
          status: 'ANSWERED',
          questionText: 'How does this improve testing?',
          answerText: 'Dependencies can be replaced with test doubles.',
          vacancyQuestion: null,
          followUpFrom: { id: ids.coreOne },
        },
      ],
    },
  };
  const defaultEvaluation = {
    summary: 'Clear foundations with evidence to probe database performance further.',
    competencies: { communication: 'GOOD', technicalDepth: 'MODERATE', problemSolving: 'GOOD' },
    skills: [
      {
        vacancyTechnologyId: ids.required,
        level: 'GOOD',
        evidence: 'Explained the composition root.',
      },
      {
        vacancyTechnologyId: ids.preferred,
        level: 'WEAK',
        evidence: 'Only a high-level isolation answer was given.',
      },
    ],
    strengths: [
      {
        questionIds: [ids.coreOne, ids.followUp],
        text: 'Connected dependency injection to testability.',
      },
    ],
    areasToProbe: [
      { questionIds: [ids.coreTwo], text: 'Probe production isolation-level tradeoffs.' },
    ],
  };
  const prisma = {
    interviewSession: {
      async findFirst({ where }) {
        return where.invitationId === state.session.invitationId ? state.session : null;
      },
      async updateMany({ where, data }) {
        if (where.id !== state.session.id) return { count: 0 };
        const permitted =
          where.evaluationStatus?.in?.includes(state.session.evaluationStatus) ??
          where.evaluationStatus === state.session.evaluationStatus;
        if (!permitted) return { count: 0 };
        Object.assign(state.session, data);
        return { count: 1 };
      },
    },
  };
  return {
    state,
    service: new InterviewOverallEvaluationService(
      {
        async evaluate(input) {
          state.inputs.push(input);
          if (providerError) throw providerError;
          return evaluation ?? defaultEvaluation;
        },
      },
      prisma,
      {
        async findOne() {
          return { candidateId: 'candidate-1' };
        },
      },
      { log() {}, error() {} },
    ),
  };
}

test('sends all core and follow-up evidence once and calculates required and preferred coverage deterministically', async () => {
  const { service, state } = createFixture();
  const response = await service.evaluate(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1');
  assert.equal(state.inputs.length, 1);
  assert.equal(state.inputs[0].coreAnswers.length, 2);
  assert.equal(state.inputs[0].followUpAnswers.length, 1);
  assert.equal(state.inputs[0].vacancy.skills.length, 2);
  assert.equal(response.overallScore, 75);
  assert.equal(response.candidateIntelligence.requiredSkills.coverage, 75);
  assert.equal(response.candidateIntelligence.preferredSkills.coverage, 25);
  assert.equal(response.candidateIntelligence.preferredSkills.skills[0].level, 'WEAK');
  assert.equal(state.session.evaluationStatus, 'EVALUATED');
});

test('sends custom question text and optional plain-text criteria to the existing evaluator', async () => {
  const { service, state } = createFixture();
  state.session.answers.push({
    id: '00000000-0000-4000-8000-000000000006',
    sequence: 3,
    followUpFromId: null,
    status: 'ANSWERED',
    questionText: 'Tell us about a difficult stakeholder decision.',
    answerText: 'I made the trade-off explicit and aligned the team.',
    vacancyQuestion: null,
    vacancyCustomQuestion: { evaluationCriteria: 'Assess ownership and communication.' },
    followUpFrom: null,
  });

  await service.evaluate(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1');

  const customAnswer = state.inputs[0].coreAnswers.find(
    (answer) => answer.question.questionText === 'Tell us about a difficult stakeholder decision.',
  );
  assert.deepEqual(customAnswer?.question, {
    difficulty: 'ADVANCED',
    evaluationCriteria: 'Assess ownership and communication.',
    questionText: 'Tell us about a difficult stakeholder decision.',
    questionType: 'CUSTOM',
    technology: null,
    technologySegment: null,
  });
});

test('does not call the provider before an interview is complete', async () => {
  const { service, state } = createFixture({ status: 'IN_PROGRESS' });
  await assert.rejects(service.evaluate(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1'), {
    status: 409,
  });
  assert.equal(state.inputs.length, 0);
});

test('rejects an unconfigured skill result and marks the evaluation retryable', async () => {
  const { service, state } = createFixture({
    evaluation: {
      summary: 'Invalid evidence.',
      competencies: { communication: 'GOOD', technicalDepth: 'GOOD', problemSolving: 'GOOD' },
      skills: [
        { vacancyTechnologyId: ids.required, level: 'GOOD', evidence: 'Evidence.' },
        {
          vacancyTechnologyId: '00000000-0000-4000-8000-000000000099',
          level: 'GOOD',
          evidence: 'Invented skill.',
        },
      ],
      strengths: [{ questionIds: [ids.coreOne], text: 'Evidence.' }],
      areasToProbe: [{ questionIds: [ids.coreTwo], text: 'Probe.' }],
    },
  });
  await assert.rejects(service.evaluate(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1'), {
    status: 409,
  });
  assert.equal(state.session.evaluationStatus, 'FAILED');
  assert.equal(state.session.overallScore, null);
});

test('marks provider failures for retry without changing completed interview answers', async () => {
  const { service, state } = createFixture({ providerError: new Error('provider unavailable') });
  await assert.rejects(service.evaluate(user, 'vacancy-1', 'vacancy-candidate-1', 'interview-1'));
  assert.equal(state.session.evaluationStatus, 'FAILED');
  assert.equal(state.session.overallScore, null);
  assert.equal(state.session.answers[0].answerText, 'Use a composition root.');
});
