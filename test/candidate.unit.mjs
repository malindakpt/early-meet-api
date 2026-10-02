import assert from 'node:assert/strict';
import test from 'node:test';

import { CandidateService } from '../dist/api-modules/candidates/candidate.service.js';

function candidateData(overrides = {}) {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+94111234567',
    status: 'ACTIVE',
    ...overrides,
  };
}

function createFixture() {
  const state = { candidates: new Map(), nextId: 1 };
  const prisma = {
    candidate: {
      async create({ data }) {
        const candidate = {
          id: `candidate-${state.nextId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.candidates.set(candidate.id, candidate);
        return candidate;
      },
      async findUnique({ where }) {
        return state.candidates.get(where.id) ?? null;
      },
      async findFirst({ where }) {
        return (
          [...state.candidates.values()].find((candidate) => candidate.email === where.email) ??
          null
        );
      },
      async update({ where, data }) {
        const candidate = state.candidates.get(where.id);
        Object.assign(candidate, data, { updatedAt: new Date() });
        return candidate;
      },
    },
  };
  return { service: new CandidateService(prisma), state };
}

test('creates and retrieves independently managed candidates', async () => {
  const { service } = createFixture();
  const created = await service.create(candidateData());

  assert.equal(created.name, 'Ada Lovelace');
  assert.deepEqual(await service.findOne(created.id), created);
  await assert.rejects(service.findOne('missing-candidate'), { status: 404 });
});

test('partially updates candidate information without changing unspecified fields', async () => {
  const { service } = createFixture();
  const created = await service.create(candidateData());
  const updated = await service.update(created.id, {
    name: 'Ada Byron',
    phone: '+94119876543',
    status: 'INACTIVE',
  });

  assert.equal(updated.name, 'Ada Byron');
  assert.equal(updated.phone, '+94119876543');
  assert.equal(updated.status, 'INACTIVE');
  assert.equal(updated.email, 'ada@example.com');
});

test('reuses the earliest candidate with a matching email for vacancy association', async () => {
  const { service, state } = createFixture();
  const first = await service.create(candidateData());
  const reused = await service.findOrCreate(candidateData({ name: 'Different submission' }));

  assert.equal(reused.id, first.id);
  assert.equal(state.candidates.size, 1);
});
