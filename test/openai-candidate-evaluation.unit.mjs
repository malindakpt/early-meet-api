import assert from 'node:assert/strict';
import test from 'node:test';

import { OpenAiCandidateEvaluationService } from '../dist/api-modules/ai/openai-candidate-evaluation.service.js';

const input = {
  cvText: 'Ada Lovelace. Node.js engineer since 2020.',
  vacancy: {
    title: 'Backend Engineer',
    description: 'Build services.',
    experienceMin: 3,
    experienceMax: 6,
    employmentType: 'FULL_TIME',
    workType: 'REMOTE',
    technologies: [{ name: 'Node.js', requirementType: 'REQUIRED', segments: [] }],
  },
};

const cv = {
  candidate: {
    fullName: 'Ada Lovelace',
    email: null,
    phone: null,
    location: null,
    linkedInUrl: null,
    portfolioUrl: null,
  },
  summary: null,
  skills: [{ name: 'Node.js', category: null, yearsOfExperience: null }],
  workExperience: [],
  education: [],
  certifications: [],
};

test('uses structured output and validates candidate evaluation results before returning them', async () => {
  let request;
  const client = {
    responses: {
      async parse(value) {
        request = value;
        return {
          output_parsed: {
            cv,
            score: 87,
            summary: 'The candidate is a strong evidence-based match.',
            matchedRequirements: ['The CV demonstrates Node.js experience.'],
            missingRequirements: [],
          },
        };
      },
    },
  };
  const service = new OpenAiCandidateEvaluationService(client, 'test-evaluation-model');
  const result = await service.evaluate(input);

  assert.equal(result.score, 87);
  assert.equal(result.cv.candidate.fullName, 'Ada Lovelace');
  assert.equal(request.model, 'test-evaluation-model');
  // The CV travels as a JSON string field alongside the server-built vacancy, never as the prompt.
  assert.deepEqual(JSON.parse(request.input), input);
  assert.equal(request.instructions.includes('untrusted data'), true);
  assert.equal('format' in request.text, true);
});

test('rejects invalid structured model output without exposing provider details', async () => {
  const client = {
    responses: {
      async parse() {
        return {
          output_parsed: {
            cv,
            score: 101,
            summary: 'A summary',
            matchedRequirements: ['Evidence-based strength'],
            missingRequirements: [],
          },
        };
      },
    },
  };
  const service = new OpenAiCandidateEvaluationService(client, 'test-evaluation-model');

  await assert.rejects(service.evaluate(input), {
    message: 'Unable to evaluate the candidate.',
  });
});

test('rejects a response that omits the CV extraction', async () => {
  const client = {
    responses: {
      async parse() {
        return {
          output_parsed: {
            score: 50,
            summary: 'A summary',
            matchedRequirements: [],
            missingRequirements: [],
          },
        };
      },
    },
  };
  const service = new OpenAiCandidateEvaluationService(client, 'test-evaluation-model');

  await assert.rejects(service.evaluate(input), { message: 'Unable to evaluate the candidate.' });
});
