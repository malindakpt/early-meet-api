import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ProblemDetailsFilter } from '../dist/common/filters/problem-details.filter.js';
import { serializeError } from '../dist/infrastructure/logging/error-serializer.js';

function runFilter(exception) {
  const logs = [];
  const logger = {
    error: (message, context) => logs.push({ context, level: 'error', message }),
    warn: (message, context) => logs.push({ context, level: 'warn', message }),
  };
  const sent = {};
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'POST', originalUrl: '/api/v1/things', requestId: 'req_1' }),
      getResponse: () => ({
        status(code) {
          sent.status = code;
          return this;
        },
        json(body) {
          sent.body = body;
        },
      }),
    }),
  };
  new ProblemDetailsFilter(logger).catch(exception, host);
  return { logs, sent };
}

test('logs 4xx failures as warnings with request context and keeps the response unchanged', () => {
  const { logs, sent } = runFilter(new ConflictException('Already exists.'));

  assert.equal(sent.status, 409);
  assert.equal(sent.body.detail, 'Already exists.');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].level, 'warn');
  assert.deepEqual(
    {
      detail: logs[0].context.detail,
      method: logs[0].context.method,
      path: logs[0].context.path,
      requestId: logs[0].context.requestId,
      statusCode: logs[0].context.statusCode,
    },
    { detail: 'Already exists.', method: 'POST', path: '/api/v1/things', requestId: 'req_1', statusCode: 409 },
  );
});

test('logs the validation messages that the 400 response summarises', () => {
  const { logs, sent } = runFilter(
    new BadRequestException({ message: ['email must be an email'], statusCode: 400 }),
  );

  assert.equal(sent.body.detail, 'One or more fields are invalid.');
  assert.deepEqual(logs[0].context.validationMessages, ['email must be an email']);
});

test('logs 5xx failures as errors with stack and the wrapped cause', () => {
  const cause = new Error('OpenAI request timed out');
  const { logs, sent } = runFilter(
    new InternalServerErrorException('Unable to evaluate the candidate.', { cause }),
  );

  assert.equal(sent.status, 500);
  assert.equal(sent.body.detail, 'Unable to evaluate the candidate.');
  assert.equal(logs[0].level, 'error');
  assert.equal(logs[0].context.error.message, 'Unable to evaluate the candidate.');
  assert.equal(logs[0].context.error.cause.message, 'OpenAI request timed out');
  assert.match(logs[0].context.error.stack, /InternalServerErrorException/);
});

test('logs unexpected non-HTTP errors with their real message while the client gets the safe one', () => {
  const { logs, sent } = runFilter(Object.assign(new Error('relation "Vacancy" does not exist'), { code: 'P2021' }));

  assert.equal(sent.body.detail, 'An unexpected error occurred.');
  assert.equal(logs[0].context.error.message, 'relation "Vacancy" does not exist');
  assert.equal(logs[0].context.error.code, 'P2021');
});

test('serializes non-Error values and truncates runaway cause chains', () => {
  assert.deepEqual(serializeError('boom'), { message: 'boom', name: 'string' });

  const looping = new Error('loop');
  looping.cause = looping;
  let depth = 0;
  let current = serializeError(looping);
  while (typeof current.cause === 'object') {
    current = current.cause;
    depth += 1;
  }
  assert.equal(current.cause, 'Cause chain truncated.');
  assert.equal(depth, 5);
});
