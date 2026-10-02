import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma } from '@prisma/client';

import { TechnologySegmentService } from '../dist/api-modules/technology-segments/technology-segment.service.js';

function segmentData(name = 'Fundamentals') {
  return { name, description: `${name} concepts`, status: 'ACTIVE' };
}

function createFixture() {
  const state = {
    segments: new Map(),
    technologies: new Map([
      ['technology-1', { id: 'technology-1' }],
      ['technology-2', { id: 'technology-2' }],
    ]),
    nextId: 1,
  };
  const duplicateError = () =>
    new Prisma.PrismaClientKnownRequestError('duplicate segment', {
      code: 'P2002',
      clientVersion: 'test',
    });
  const technologyService = {
    async findOne(technologyId) {
      const technology = state.technologies.get(technologyId);
      if (!technology) {
        const error = new Error('Technology not found.');
        error.status = 404;
        throw error;
      }
      return technology;
    },
  };
  const prisma = {
    technologySegment: {
      async create({ data }) {
        if (
          [...state.segments.values()].some(
            (segment) => segment.technologyId === data.technologyId && segment.name === data.name,
          )
        ) {
          throw duplicateError();
        }
        const segment = {
          id: `segment-${state.nextId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.segments.set(segment.id, segment);
        return segment;
      },
      async findMany({ where = {} }) {
        return [...state.segments.values()]
          .filter(
            (segment) =>
              where.technologyId === undefined || segment.technologyId === where.technologyId,
          )
          .sort((left, right) => left.name.localeCompare(right.name));
      },
      async findFirst({ where }) {
        const segment = state.segments.get(where.id);
        return segment?.technologyId === where.technologyId ? segment : null;
      },
      async update({ where, data }) {
        const segment = state.segments.get(where.id);
        if (
          data.name !== undefined &&
          [...state.segments.values()].some(
            (existing) =>
              existing.id !== where.id &&
              existing.technologyId === segment.technologyId &&
              existing.name === data.name,
          )
        ) {
          throw duplicateError();
        }
        Object.assign(segment, data, { updatedAt: new Date() });
        return segment;
      },
    },
  };
  return { service: new TechnologySegmentService(prisma, technologyService), state };
}

test('creates a segment under its existing technology', async () => {
  const { service } = createFixture();
  const segment = await service.create('technology-1', segmentData());

  assert.equal(segment.technologyId, 'technology-1');
  assert.equal(segment.name, 'Fundamentals');
});

test('rejects operations for nonexistent technologies', async () => {
  const { service } = createFixture();

  await assert.rejects(service.create('missing-technology', segmentData()), { status: 404 });
  await assert.rejects(service.findAll('missing-technology'), { status: 404 });
});

test('lists and retrieves only segments belonging to the route technology', async () => {
  const { service } = createFixture();
  const fundamentals = await service.create('technology-1', segmentData());
  const types = await service.create('technology-1', segmentData('Types'));
  const react = await service.create('technology-2', segmentData('Components'));

  assert.deepEqual(
    (await service.findAll('technology-1')).map((segment) => segment.name),
    ['Fundamentals', 'Types'],
  );
  assert.deepEqual(await service.findOne('technology-1', fundamentals.id), fundamentals);
  await assert.rejects(service.findOne('technology-1', react.id), { status: 404 });
  await assert.rejects(service.findOne('technology-1', 'missing-segment'), { status: 404 });
  assert.equal(types.technologyId, 'technology-1');
});

test('lists segments across technologies in name order for platform administration', async () => {
  const { service } = createFixture();
  await service.create('technology-1', segmentData('Types'));
  await service.create('technology-2', segmentData('Components'));

  assert.deepEqual(
    (await service.findAllAcrossTechnologies()).map((segment) => segment.name),
    ['Components', 'Types'],
  );
});

test('partially updates all supplied fields without changing immutable relation or unspecified fields', async () => {
  const { service } = createFixture();
  const created = await service.create('technology-1', segmentData());
  const updated = await service.update('technology-1', created.id, {
    name: 'Core Fundamentals',
    description: 'Updated concepts',
    status: 'INACTIVE',
  });

  assert.equal(updated.name, 'Core Fundamentals');
  assert.equal(updated.description, 'Updated concepts');
  assert.equal(updated.status, 'INACTIVE');
  assert.equal(updated.technologyId, 'technology-1');
  assert.equal(updated.id, created.id);
  assert.equal(updated.createdAt, created.createdAt);
});

test('rejects duplicate names for the same technology and cross-technology updates', async () => {
  const { service } = createFixture();
  const fundamentals = await service.create('technology-1', segmentData());
  const types = await service.create('technology-1', segmentData('Types'));
  const react = await service.create('technology-2', segmentData('Fundamentals'));

  await assert.rejects(service.create('technology-1', segmentData()), { status: 409 });
  await assert.rejects(service.update('technology-1', types.id, { name: fundamentals.name }), {
    status: 409,
  });
  await assert.rejects(service.update('technology-1', react.id, { status: 'INACTIVE' }), {
    status: 404,
  });
});
