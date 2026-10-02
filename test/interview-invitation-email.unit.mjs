import assert from 'node:assert/strict';
import test from 'node:test';

import { InterviewInvitationEmailService } from '../dist/api-modules/email/interview-invitation-email.service.js';

test('sends a candidate-safe interview invitation with an opaque tokenized URL', async () => {
  const messages = [];
  const service = new InterviewInvitationEmailService(
    {
      getOrThrow(name) {
        return {
          INTERVIEW_APP_URL: 'https://interview.example.com',
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

  await service.send({
    candidateEmail: 'ada@example.com',
    candidateName: 'Ada Lovelace',
    estimatedInterviewTimeSeconds: 300,
    token: 'opaque_token',
    vacancyTitle: 'Backend Engineer',
  });

  assert.deepEqual(messages, [
    {
      from: 'AI Interview Platform <no-reply@example.com>',
      to: 'ada@example.com',
      subject: 'Interview Invitation - Backend Engineer',
      text: 'Hello Ada Lovelace,\n\nYou have been invited to complete an interview for Backend Engineer. Estimated interview time: about 5 minutes.\n\nStart your interview: https://interview.example.com/interview/opaque_token',
    },
  ]);
});
