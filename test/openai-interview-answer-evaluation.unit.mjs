import assert from 'node:assert/strict';
import test from 'node:test';

import { OpenAiInterviewAnswerEvaluationService } from '../dist/api-modules/ai/openai-interview-answer-evaluation.service.js';

const input = {
  answerText: 'Dependencies are composed at application startup.',
  question: {
    questionText: 'Explain dependency injection.',
    difficulty: 'ADVANCED',
    questionType: 'OPEN_ENDED',
    evaluationCriteria: { expected: 'composition root' },
  },
};

function createFixture({ output, error } = {}) {
  const requests = [];
  const client = {
    responses: {
      async parse(request) {
        requests.push(request);
        if (error !== undefined) {
          throw error;
        }
        return { output_parsed: output };
      },
    },
  };
  return {
    service: new OpenAiInterviewAnswerEvaluationService(client, 'test-model'),
    requests,
  };
}

test('uses structured output and returns validated answer evaluation values', async () => {
  const { service, requests } = createFixture({
    output: { score: 85, explanation: 'Correctly identifies composition at startup.' },
  });

  const evaluation = await service.evaluate(input);
  assert.deepEqual(evaluation, {
    score: 85,
    explanation: 'Correctly identifies composition at startup.',
  });
  assert.equal(requests[0].model, 'test-model');
  assert.equal(requests[0].input, JSON.stringify(input));
  assert.equal(requests[0].instructions.includes('compare this answer'), true);
});

test('rejects malformed and out-of-range structured provider output without exposing provider details', async () => {
  for (const output of [
    { score: 101, explanation: 'Invalid score.' },
    { score: '85', explanation: 'Invalid type.' },
    { score: 85 },
  ]) {
    const { service } = createFixture({ output });
    await assert.rejects(service.evaluate(input), {
      status: 500,
      message: 'Unable to evaluate the interview answer.',
    });
  }

  const { service } = createFixture({ error: new Error('rate limited') });
  await assert.rejects(service.evaluate(input), {
    status: 500,
    message: 'Unable to evaluate the interview answer.',
  });
});
