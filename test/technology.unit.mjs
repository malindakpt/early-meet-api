import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma } from '@prisma/client';

import { PlatformAdminGuard } from '../dist/api-modules/auth/guards/platform-admin.guard.js';
import { TechnologyService } from '../dist/api-modules/technologies/technology.service.js';

function technologyData(name = 'TypeScript') {
  return { name, description: `${name} programming language`, status: 'ACTIVE' };
}

function createFixture() {
  const state = { technologies: new Map(), nextId: 1 };
  const duplicateError = () =>
    new Prisma.PrismaClientKnownRequestError('duplicate technology', {
      code: 'P2002',
      clientVersion: 'test',
    });
  const prisma = {
    technology: {
      async create({ data }) {
        if ([...state.technologies.values()].some((technology) => technology.name === data.name)) {
          throw duplicateError();
        }
        const technology = {
          id: `technology-${state.nextId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.technologies.set(technology.id, technology);
        return technology;
      },
      async findMany() {
        return [...state.technologies.values()].sort((left, right) =>
          left.name.localeCompare(right.name),
        );
      },
      async findUnique({ where }) {
        return state.technologies.get(where.id) ?? null;
      },
      async update({ where, data }) {
        const technology = state.technologies.get(where.id);
        if (
          data.name !== undefined &&
          [...state.technologies.values()].some(
            (existing) => existing.id !== where.id && existing.name === data.name,
          )
        ) {
          throw duplicateError();
        }
        Object.assign(technology, data, { updatedAt: new Date() });
        return technology;
      },
    },
  };
  return { service: new TechnologyService(prisma), state };
}

test('platform administrator access requires the PLATFORM_ADMIN role', () => {
  const guard = new PlatformAdminGuard();
  const adminContext = {
    switchToHttp: () => ({ getRequest: () => ({ user: { role: 'PLATFORM_ADMIN' } }) }),
  };
  const hrContext = { switchToHttp: () => ({ getRequest: () => ({ user: { role: 'HR' } }) }) };

  assert.equal(guard.canActivate(adminContext), true);
  assert.throws(() => guard.canActivate(hrContext), { status: 403 });
});

test('creates and lists shared technologies in name order', async () => {
  const { service } = createFixture();
  const typeScript = await service.create(technologyData());
  await service.create(technologyData('Angular'));

  assert.equal(typeScript.name, 'TypeScript');
  assert.deepEqual(
    (await service.findAll()).map((technology) => technology.name),
    ['Angular', 'TypeScript'],
  );
});

test('retrieves technologies and returns not found for absent identifiers', async () => {
  const { service } = createFixture();
  const technology = await service.create(technologyData());

  assert.deepEqual(await service.findOne(technology.id), technology);
  await assert.rejects(service.findOne('missing-technology'), { status: 404 });
});

test('partially updates every supplied field without changing unspecified fields', async () => {
  const { service } = createFixture();
  const created = await service.create(technologyData());
  const updated = await service.update(created.id, {
    name: 'TypeScript 5',
    description: 'Updated description',
    status: 'INACTIVE',
  });

  assert.equal(updated.name, 'TypeScript 5');
  assert.equal(updated.description, 'Updated description');
  assert.equal(updated.status, 'INACTIVE');
  assert.equal(updated.id, created.id);
  assert.equal(updated.createdAt, created.createdAt);
});

test('maps database duplicate names to conflicts for create and update', async () => {
  const { service } = createFixture();
  const typeScript = await service.create(technologyData());
  const react = await service.create(technologyData('React'));

  await assert.rejects(service.create(technologyData()), { status: 409 });
  await assert.rejects(service.update(react.id, { name: typeScript.name }), { status: 409 });
});
