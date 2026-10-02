import assert from 'node:assert/strict';
import test from 'node:test';

import { OpenAiInterviewFollowUpService } from '../dist/api-modules/ai/openai-interview-follow-up.service.js';

const input = {
  question: {
    questionText: 'Explain dependency injection.',
    evaluationCriteria: { expected: 'composition root and testability' },
  },
  answer: {
    text: 'Use a composition root to provide dependencies.',
    evaluation: { score: 65, explanation: 'Testability was not explained.' },
  },
};

function createFixture({ output } = {}) {
  const requests = [];
  return {
    service: new OpenAiInterviewFollowUpService(
      {
        responses: {
          async parse(request) {
            requests.push(request);
            return { output_parsed: output };
          },
        },
      },
      'test-model',
    ),
    requests,
  };
}

test('returns a validated structured follow-up decision using the supplied bounded input', async () => {
  const { service, requests } = createFixture({
    output: {
      shouldFollowUp: true,
      reason: 'Testability was not addressed.',
      followUpQuestion: 'How does dependency injection improve testability?',
    },
  });
  const decision = await service.decide(input);

  assert.deepEqual(decision, {
    shouldFollowUp: true,
    reason: 'Testability was not addressed.',
    followUpQuestion: 'How does dependency injection improve testability?',
  });
  assert.equal(requests[0].model, 'test-model');
  assert.equal(requests[0].input, JSON.stringify(input));
  assert.equal(requests[0].instructions.includes('other candidates'), true);
});

test('rejects invalid boolean, null, missing, and excessively large follow-up output', async () => {
  for (const output of [
    { shouldFollowUp: 'true', reason: 'Invalid boolean.', followUpQuestion: 'Question?' },
    { shouldFollowUp: false, reason: 'Invalid null contract.', followUpQuestion: 'Question?' },
    { shouldFollowUp: true, reason: 'Missing question.', followUpQuestion: null },
    { shouldFollowUp: true, reason: 'Too long.', followUpQuestion: 'x'.repeat(2_001) },
  ]) {
    const { service } = createFixture({ output });
    await assert.rejects(service.decide(input), {
      status: 500,
      message: 'Unable to decide whether a follow-up is needed.',
    });
  }
});
