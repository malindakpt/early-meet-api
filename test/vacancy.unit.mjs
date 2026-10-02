import assert from 'node:assert/strict';
import test from 'node:test';

import { VacancyService } from '../dist/api-modules/vacancies/vacancy.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function vacancyData() {
  return {
    title: 'Backend Engineer',
    location: 'Colombo',
    employmentType: 'FULL_TIME',
    workType: 'HYBRID',
    jobDescription: 'Build platform APIs.',
    experienceMin: 3,
    experienceMax: 5,
    deadline: new Date('2026-09-30T00:00:00.000Z'),
    duration: 60,
    interviewType: 'TECHNICAL',
    difficulty: 'INTERMEDIATE',
    status: 'DRAFT',
    notes: 'Initial notes.',
  };
}

function createFixture() {
  const state = {
    vacancies: new Map(),
    nextId: 1,
  };
  const prisma = {
    vacancy: {
      async create({ data }) {
        const vacancy = {
          id: `vacancy-${state.nextId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.vacancies.set(vacancy.id, vacancy);
        return vacancy;
      },
      async findMany({ where }) {
        return [...state.vacancies.values()].filter(
          (vacancy) => vacancy.organizationId === where.organizationId,
        );
      },
      async findFirst({ where }) {
        const vacancy = state.vacancies.get(where.id);
        return vacancy?.organizationId === where.organizationId ? vacancy : null;
      },
      async update({ where, data }) {
        const vacancy = state.vacancies.get(where.id);
        Object.assign(vacancy, data, { updatedAt: new Date() });
        return vacancy;
      },
    },
  };
  return { service: new VacancyService(prisma), state };
}

test('creates vacancies from authenticated organization and user identity', async () => {
  const { service, state } = createFixture();
  const vacancy = await service.create(organizationOneUser, vacancyData());

  assert.equal(vacancy.organizationId, organizationOneUser.organizationId);
  assert.equal(vacancy.createdBy, organizationOneUser.id);
  assert.equal(vacancy.title, 'Backend Engineer');
  assert.equal(state.vacancies.size, 1);
});

test('lists and retrieves only vacancies belonging to the authenticated organization', async () => {
  const { service } = createFixture();
  const ownedVacancy = await service.create(organizationOneUser, vacancyData());
  const otherVacancy = await service.create(organizationTwoUser, vacancyData());

  assert.deepEqual(await service.findAll(organizationOneUser), [ownedVacancy]);
  await assert.rejects(service.findOne(organizationOneUser, otherVacancy.id), { status: 404 });
});

test('partially updates all supplied mutable properties without changing unspecified fields', async () => {
  const { service } = createFixture();
  const created = await service.create(organizationOneUser, vacancyData());
  const updated = await service.update(organizationOneUser, created.id, {
    title: 'Senior Backend Engineer',
    status: 'ACTIVE',
    experienceMax: 7,
  });

  assert.equal(updated.title, 'Senior Backend Engineer');
  assert.equal(updated.status, 'ACTIVE');
  assert.equal(updated.experienceMax, 7);
  assert.equal(updated.location, 'Colombo');
  assert.equal(updated.departmentId, undefined);
  assert.equal(updated.organizationId, organizationOneUser.organizationId);
  assert.equal(updated.createdBy, organizationOneUser.id);
});

test('rejects updates to vacancies outside the authenticated organization and nonexistent vacancies', async () => {
  const { service } = createFixture();
  const otherVacancy = await service.create(organizationTwoUser, vacancyData());

  await assert.rejects(service.update(organizationOneUser, otherVacancy.id, { title: 'Blocked' }), {
    status: 404,
  });
  await assert.rejects(
    service.update(organizationOneUser, 'missing-vacancy', { title: 'Missing' }),
    {
      status: 404,
    },
  );
});
