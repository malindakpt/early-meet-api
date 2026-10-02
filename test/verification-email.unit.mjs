import assert from 'node:assert/strict';
import test from 'node:test';

import { VerificationEmailService } from '../dist/api-modules/email/verification-email.service.js';

test('sends a verification email with a tokenized browser URL', async () => {
  const messages = [];
  const service = new VerificationEmailService(
    {
      getOrThrow(name) {
        return {
          WEB_APP_URL: 'https://app.example.com',
          EMAIL_FROM: 'AI Interview Platform <no-reply@example.com>',
        }[name];
      },
    },
    {
      async sendMail(message) {
        messages.push(message);
      },
    },
  );

  await service.send({ email: 'hr@example.com', token: 'token with spaces' });

  assert.deepEqual(messages, [
    {
      from: 'AI Interview Platform <no-reply@example.com>',
      to: 'hr@example.com',
      subject: 'Verify your email address',
      text: 'Verify your email address by opening https://app.example.com/verify-email?token=token+with+spaces',
    },
  ]);
});
