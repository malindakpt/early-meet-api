import assert from 'node:assert/strict';
import test from 'node:test';

import { OpenAiInterviewOverallEvaluationService } from '../dist/api-modules/ai/openai-interview-overall-evaluation.service.js';

const input = {
  vacancy: {
    title: 'Backend Engineer',
    description: 'Build dependable APIs.',
    interviewType: 'TECHNICAL',
    difficulty: 'ADVANCED',
    skills: [
      {
        vacancyTechnologyId: '00000000-0000-4000-8000-000000000001',
        name: 'TypeScript',
        segmentName: 'Architecture',
        requirementType: 'REQUIRED',
      },
    ],
  },
  coreAnswers: [
    {
      sequence: 1,
      question: {
        questionText: 'Explain dependency injection.',
        difficulty: 'ADVANCED',
        questionType: 'OPEN_ENDED',
        technology: 'TypeScript',
        technologySegment: 'Architecture',
      },
      questionId: '00000000-0000-4000-8000-000000000002',
      answerText: 'Use a composition root.',
    },
  ],
  followUpAnswers: [],
};

function createFixture({ error, output } = {}) {
  const requests = [];
  return {
    service: new OpenAiInterviewOverallEvaluationService(
      {
        responses: {
          async parse(request) {
            requests.push(request);
            if (error !== undefined) throw error;
            return { output_parsed: output };
          },
        },
      },
      'test-model',
    ),
    requests,
  };
}

test('uses structured output for whole-interview evidence without letting the provider control the score', async () => {
  const { service, requests } = createFixture({
    output: {
      summary: 'Strong fundamentals.',
      competencies: { communication: 'GOOD', technicalDepth: 'GOOD', problemSolving: 'GOOD' },
      skills: [
        {
          vacancyTechnologyId: '00000000-0000-4000-8000-000000000001',
          level: 'GOOD',
          evidence: 'Correct answer.',
        },
      ],
      strengths: [
        {
          questionIds: ['00000000-0000-4000-8000-000000000002'],
          text: 'Clear technical explanation.',
        },
      ],
      areasToProbe: [],
    },
  });
  const evaluation = await service.evaluate(input);

  assert.equal(evaluation.summary, 'Strong fundamentals.');
  assert.equal(requests[0].model, 'test-model');
  assert.equal(requests[0].input, JSON.stringify(input));
  assert.equal(requests[0].instructions.includes('never add skills'), true);
  assert.equal(requests[0].instructions.includes('recordings'), true);
});

test('rejects malformed summary output and provider failures without exposing provider details', async () => {
  for (const output of [
    { summary: 'Missing collections.' },
    { summary: '', competencies: {}, skills: [], strengths: [], areasToProbe: [] },
    {
      summary: 'Wrong skill assessment.',
      competencies: { communication: 'GOOD', technicalDepth: 'GOOD', problemSolving: 'GOOD' },
      skills: [{ vacancyTechnologyId: 'invalid', level: 'GOOD', evidence: 'Invalid.' }],
      strengths: [],
      areasToProbe: [],
    },
  ]) {
    const { service } = createFixture({ output });
    await assert.rejects(service.evaluate(input), {
      status: 500,
      message: 'Unable to evaluate the completed interview.',
    });
  }
  const { service } = createFixture({ error: new Error('rate limited') });
  await assert.rejects(service.evaluate(input), {
    status: 500,
    message: 'Unable to evaluate the completed interview.',
  });
});
