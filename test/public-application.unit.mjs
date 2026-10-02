import assert from 'node:assert/strict';
import test from 'node:test';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { VacancyService } from '../dist/api-modules/vacancies/vacancy.service.js';
import { calculateKeywordMatch } from '../dist/api-modules/vacancy-candidates/keyword-cv-match.js';
import { VacancyCandidateService } from '../dist/api-modules/vacancy-candidates/vacancy-candidate.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const token = 'a'.repeat(64);

function createVacancyService(vacancy) {
  const prisma = {
    vacancy: {
      async findUnique({ select, where }) {
        if (vacancy === null || where.publicApplicationToken !== token) return null;
        // Honour `select` like Prisma so tests catch internal fields leaking into public views.
        return Object.fromEntries(Object.keys(select).map((key) => [key, vacancy[key]]));
      },
    },
  };
  return new VacancyService(prisma);
}

function postedVacancy(overrides = {}) {
  return {
    deadline: new Date(Date.now() + 7 * DAY_MS),
    employmentType: 'FULL_TIME',
    experienceMax: 5,
    experienceMin: 2,
    id: 'vacancy-1',
    jobDescription: 'Build things.',
    location: 'Colombo',
    notes: 'internal HR notes',
    organization: { name: 'Acme' },
    status: 'DRAFT',
    title: 'Engineer',
    workType: 'REMOTE',
    ...overrides,
  };
}

test('public application view exposes the posting and company, not internal fields', async () => {
  const view = await createVacancyService(postedVacancy()).findPublicApplication(token);

  assert.equal(view.companyName, 'Acme');
  assert.equal(view.title, 'Engineer');
  assert.equal(view.acceptingApplications, true);
  assert.equal('organization' in view, false);
  assert.equal('status' in view, false);
  assert.equal('notes' in view, false);
  assert.equal('id' in view, false);
});

test('unknown public application token is not found', async () => {
  await assert.rejects(createVacancyService(null).findPublicApplication(token), NotFoundException);
});

test('applications stay open through the whole deadline day and for draft vacancies', async () => {
  const deadlineToday = new Date(Date.now() - 60 * 60 * 1000);
  const service = createVacancyService(postedVacancy({ deadline: deadlineToday }));

  assert.deepEqual(await service.findAcceptingPublicApplication(token), { id: 'vacancy-1' });
});

test('closed, archived and past-deadline vacancies reject applications', async () => {
  for (const overrides of [
    { status: 'CLOSED' },
    { status: 'ARCHIVED' },
    { deadline: new Date(Date.now() - 2 * DAY_MS) },
  ]) {
    const service = createVacancyService(postedVacancy(overrides));
    await assert.rejects(service.findAcceptingPublicApplication(token), ConflictException);
    assert.equal((await service.findPublicApplication(token)).acceptingApplications, false);
  }
});

test('server keyword match weights required, preferred and segment matches', () => {
  const result = calculateKeywordMatch('Built APIs with Node.js and Postgres, some React hooks.', [
    { requirementType: 'REQUIRED', segments: [{ name: 'Hooks' }], technology: { name: 'ReactJS' } },
    { requirementType: 'REQUIRED', segments: [], technology: { name: 'NodeJS' } },
    { requirementType: 'PREFERRED', segments: [], technology: { name: 'PostgreSQL' } },
    { requirementType: 'PREFERRED', segments: [], technology: { name: 'Kotlin' } },
  ]);

  assert.deepEqual(result.matchedTechnologies, ['ReactJS', 'NodeJS', 'PostgreSQL']);
  assert.deepEqual(result.matchedSegments, ['Hooks']);
  // (2/2 * 70 + 1/2 * 20 + 1/1 * 10) / 100
  assert.equal(result.score, 90);
});

function createCandidateFixture({ acceptingVacancy = true } = {}) {
  const state = { associations: [], candidates: [] };
  const prisma = {
    candidate: {
      async create({ data }) {
        const candidate = { id: `candidate-${state.candidates.length + 1}`, ...data };
        state.candidates.push(candidate);
        return candidate;
      },
    },
    vacancyCandidate: {
      async create({ data }) {
        state.associations.push(data);
        return data;
      },
      async findFirst({ where }) {
        const match = state.associations.find((association) => {
          const candidate = state.candidates.find((item) => item.id === association.candidateId);
          return (
            association.vacancyId === where.vacancyId &&
            candidate?.email === where.candidate.is.email
          );
        });
        return match ?? null;
      },
    },
    async $transaction(operation) {
      return operation({ ...this, $executeRaw: async () => 1 });
    },
  };
  const vacancyService = {
    async findAcceptingPublicApplication() {
      if (!acceptingVacancy)
        throw new ConflictException('Applications for this position are closed.');
      return { id: 'vacancy-1' };
    },
  };
  const vacancyTechnologyService = {
    async findKeywordMatchTechnologies() {
      return [{ requirementType: 'REQUIRED', segments: [], technology: { name: 'NodeJS' } }];
    },
  };
  const service = new VacancyCandidateService(prisma, vacancyService, {}, vacancyTechnologyService);
  return { service, state };
}

const application = {
  email: ' Ada@Example.com ',
  extractedText: 'Senior engineer. Node.js since 2015.',
  fileName: 'ada.pdf',
};

test('public submission creates a candidate with a server-computed keyword score', async () => {
  const { service, state } = createCandidateFixture();

  await service.submitPublicApplication(token, application);

  assert.equal(state.candidates[0].email, 'ada@example.com');
  assert.equal(state.associations[0].keywordMatchScore, 100);
  assert.deepEqual(state.associations[0].keywordMatchBreakdown.matchedTechnologies, ['NodeJS']);
  // No AI runs at submission: the CV is ready for an HR-triggered AI match, name unknown.
  assert.equal(state.candidates[0].processingStatus, 'READY');
  assert.equal(state.candidates[0].name, 'ada@example.com');
});

test('public submission rejects a second application with the same email', async () => {
  const { service, state } = createCandidateFixture();
  await service.submitPublicApplication(token, application);

  await assert.rejects(
    service.submitPublicApplication(token, { ...application, email: 'ADA@example.com' }),
    ConflictException,
  );
  assert.equal(state.candidates.length, 1);
});

test('public submission is rejected when the vacancy no longer accepts applications', async () => {
  const { service, state } = createCandidateFixture({ acceptingVacancy: false });

  await assert.rejects(service.submitPublicApplication(token, application), ConflictException);
  assert.equal(state.candidates.length, 0);
});
