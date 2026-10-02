import assert from 'node:assert/strict';
import test from 'node:test';

import { HealthService } from '../dist/api-modules/health/health.service.js';
import { validateEnvironment } from '../dist/infrastructure/config/environment.validation.js';

test('health service reports an operational database status', async () => {
  const service = new HealthService({
    $queryRaw: async () => [{ '?column?': 1 }],
  });

  assert.deepEqual(await service.getHealth(), { status: 'ok', database: 'connected' });
});

test('environment validation rejects a non-PostgreSQL database URL', () => {
  assert.throws(
    () =>
      validateEnvironment({
        DATABASE_URL: 'https://database.example.invalid',
      }),
    /DATABASE_URL must use the postgres or postgresql protocol/,
  );
});

const validEnvironment = {
  AUTH_SECRET: 'x'.repeat(32),
  DATABASE_URL: 'postgresql://user:password@localhost:5432/interview_platform',
  EMAIL_FROM: 'AI Interview Platform <no-reply@example.com>',
  OPENAI_API_KEY: 'test-key',
  OPENAI_CANDIDATE_EVALUATION_MODEL: 'test-model',
  OPENAI_CV_EXTRACTION_MODEL: 'test-model',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PASSWORD: 'password',
  SMTP_PORT: '587',
  SMTP_USERNAME: 'user',
  WEB_APP_URL: 'https://app.example.com',
};

test('environment validation defaults the interview app URL to the web app URL', () => {
  assert.equal(validateEnvironment(validEnvironment).INTERVIEW_APP_URL, 'https://app.example.com/');
  assert.equal(
    validateEnvironment({ ...validEnvironment, INTERVIEW_APP_URL: '  ' }).INTERVIEW_APP_URL,
    'https://app.example.com/',
  );
});

test('environment validation accepts a separate interview app URL and rejects invalid ones', () => {
  assert.equal(
    validateEnvironment({ ...validEnvironment, INTERVIEW_APP_URL: 'https://interview.example.com' })
      .INTERVIEW_APP_URL,
    'https://interview.example.com/',
  );
  assert.throws(
    () => validateEnvironment({ ...validEnvironment, INTERVIEW_APP_URL: 'not a url' }),
    /INTERVIEW_APP_URL must be a valid HTTP URL/,
  );
});
