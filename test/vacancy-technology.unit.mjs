import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma } from '@prisma/client';

import { VacancyTechnologyService } from '../dist/api-modules/vacancy-technologies/vacancy-technology.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };
const typesSegmentId = '11111111-1111-4111-8111-111111111111';
const componentsSegmentId = '22222222-2222-4222-8222-222222222222';

function createFixture() {
  const state = {
    relationships: new Map(),
    technologies: new Map([
      [
        'technology-1',
        { id: 'technology-1', name: 'TypeScript', description: 'Language', status: 'ACTIVE' },
      ],
      [
        'technology-2',
        { id: 'technology-2', name: 'React', description: 'Library', status: 'ACTIVE' },
      ],
    ]),
    segments: new Map([
      [typesSegmentId, { id: typesSegmentId, technologyId: 'technology-1', name: 'Types' }],
      [
        componentsSegmentId,
        { id: componentsSegmentId, technologyId: 'technology-2', name: 'Components' },
      ],
    ]),
    vacancies: new Map([
      ['vacancy-1', { id: 'vacancy-1', organizationId: 'organization-1' }],
      ['vacancy-2', { id: 'vacancy-2', organizationId: 'organization-2' }],
    ]),
    nextId: 1,
  };
  const notFound = (message) => {
    const error = new Error(message);
    error.status = 404;
    return error;
  };
  const duplicateError = () =>
    new Prisma.PrismaClientKnownRequestError('duplicate relationship', {
      code: 'P2002',
      clientVersion: 'test',
    });
  const vacancyService = {
    async findOne(user, vacancyId) {
      const vacancy = state.vacancies.get(vacancyId);
      if (!vacancy || vacancy.organizationId !== user.organizationId) {
        throw notFound('Vacancy not found.');
      }
      return vacancy;
    },
  };
  const technologyService = {
    async findOne(technologyId) {
      const technology = state.technologies.get(technologyId);
      if (!technology) {
        throw notFound('Technology not found.');
      }
      return technology;
    },
  };
  const technologySegmentService = {
    async findAll(technologyId) {
      return [...state.segments.values()].filter(
        (segment) => segment.technologyId === technologyId,
      );
    },
    async findOne(technologyId, segmentId) {
      const segment = state.segments.get(segmentId);
      if (!segment || segment.technologyId !== technologyId) {
        throw notFound('Technology segment not found.');
      }
      return segment;
    },
  };
  const withTechnology = (relationship) => ({
    ...relationship,
    technology: state.technologies.get(relationship.technologyId),
  });
  const prisma = {
    vacancyTechnology: {
      async create({ data }) {
        if (
          [...state.relationships.values()].some(
            (relationship) =>
              relationship.vacancyId === data.vacancyId &&
              relationship.technologyId === data.technologyId &&
              relationship.requirementType === data.requirementType,
          )
        ) {
          throw duplicateError();
        }
        const relationship = {
          id: `vacancy-technology-${state.nextId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        state.relationships.set(relationship.id, relationship);
        return withTechnology(relationship);
      },
      async findMany({ where }) {
        return [...state.relationships.values()]
          .filter((relationship) => relationship.vacancyId === where.vacancyId)
          .map(withTechnology);
      },
      async findFirst({ where }) {
        const relationship = state.relationships.get(where.id);
        return relationship?.vacancyId === where.vacancyId
          ? { technologyId: relationship.technologyId }
          : null;
      },
      async update({ where, data }) {
        const relationship = state.relationships.get(where.id);
        Object.assign(relationship, data, { updatedAt: new Date() });
        return withTechnology(relationship);
      },
      async delete({ where }) {
        const relationship = state.relationships.get(where.id);
        state.relationships.delete(where.id);
        return relationship;
      },
    },
  };
  return {
    service: new VacancyTechnologyService(
      prisma,
      vacancyService,
      technologyService,
      technologySegmentService,
    ),
    state,
  };
}

test('creates a configured technology for an authorized vacancy', async () => {
  const { service } = createFixture();
  const relationship = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'REQUIRED',
    segmentSelections: [],
  });

  assert.equal(relationship.vacancyId, 'vacancy-1');
  assert.equal(relationship.requirementType, 'REQUIRED');
  assert.equal(relationship.technology.name, 'TypeScript');
});

test('creates multiple specific segments only when they belong to the selected technology', async () => {
  const { service } = createFixture();
  const relationship = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'REQUIRED',
    segmentSelections: [typesSegmentId, typesSegmentId],
  });

  assert.deepEqual(relationship.segmentSelections, [typesSegmentId]);
  assert.deepEqual(
    relationship.segments.map((segment) => segment.name),
    ['Types'],
  );
  await assert.rejects(
    service.create(organizationOneUser, 'vacancy-1', {
      technologyId: 'technology-1',
      requirementType: 'PREFERRED',
      segmentSelections: [componentsSegmentId],
    }),
    { status: 404 },
  );
  await assert.rejects(
    service.create(organizationOneUser, 'vacancy-1', {
      technologyId: 'technology-1',
      requirementType: 'PREFERRED',
      segmentSelections: ['not-a-segment-id'],
    }),
    { status: 422 },
  );
});

test('persists ALL as the only selection without creating a TechnologySegment', async () => {
  const { service, state } = createFixture();
  const relationship = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'REQUIRED',
    segmentSelections: ['ALL'],
  });

  assert.deepEqual(relationship.segmentSelections, ['ALL']);
  assert.deepEqual(
    relationship.segments.map((segment) => segment.name),
    ['Types'],
  );
  assert.equal(state.segments.size, 2);
  await assert.rejects(
    service.create(organizationOneUser, 'vacancy-1', {
      technologyId: 'technology-1',
      requirementType: 'PREFERRED',
      segmentSelections: ['ALL', typesSegmentId],
    }),
    { status: 422 },
  );
});

test('rejects other organizations, absent vacancies, and absent technologies', async () => {
  const { service } = createFixture();
  const dto = { technologyId: 'technology-1', requirementType: 'REQUIRED', segmentSelections: [] };

  await assert.rejects(service.create(organizationOneUser, 'vacancy-2', dto), { status: 404 });
  await assert.rejects(service.create(organizationOneUser, 'missing-vacancy', dto), {
    status: 404,
  });
  await assert.rejects(
    service.create(organizationOneUser, 'vacancy-1', {
      ...dto,
      technologyId: 'missing-technology',
    }),
    { status: 404 },
  );
});

test('lists only relationships configured for the authorized vacancy', async () => {
  const { service } = createFixture();
  const owned = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'REQUIRED',
    segmentSelections: [],
  });
  await service.create(organizationTwoUser, 'vacancy-2', {
    technologyId: 'technology-2',
    requirementType: 'PREFERRED',
    segmentSelections: [],
  });

  assert.deepEqual(await service.findAll(organizationOneUser, 'vacancy-1'), [owned]);
  await assert.rejects(service.findAll(organizationOneUser, 'vacancy-2'), { status: 404 });
});

test('replaces segment selections and scopes relationships to their vacancy', async () => {
  const { service } = createFixture();
  const relationship = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'REQUIRED',
    segmentSelections: [],
  });
  const updated = await service.update(organizationOneUser, 'vacancy-1', relationship.id, {
    segmentSelections: [typesSegmentId],
  });

  assert.deepEqual(updated.segmentSelections, [typesSegmentId]);
  assert.equal(updated.technologyId, 'technology-1');
  await assert.rejects(service.update(organizationTwoUser, 'vacancy-2', relationship.id, {}), {
    status: 404,
  });
});

test('allows independent requirement categories and rejects duplicate relationships', async () => {
  const { service, state } = createFixture();
  const relationship = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'REQUIRED',
    segmentSelections: [],
  });

  const preferredRelationship = await service.create(organizationOneUser, 'vacancy-1', {
    technologyId: 'technology-1',
    requirementType: 'PREFERRED',
    segmentSelections: [],
  });
  assert.equal(preferredRelationship.requirementType, 'PREFERRED');

  await assert.rejects(
    service.create(organizationOneUser, 'vacancy-1', {
      technologyId: 'technology-1',
      requirementType: 'REQUIRED',
      segmentSelections: [],
    }),
    { status: 409 },
  );
  await service.remove(organizationOneUser, 'vacancy-1', relationship.id);
  assert.equal(state.relationships.has(relationship.id), false);
  assert.equal(state.technologies.has('technology-1'), true);
  assert.equal(state.vacancies.has('vacancy-1'), true);
  await assert.rejects(service.remove(organizationOneUser, 'vacancy-1', relationship.id), {
    status: 404,
  });
});
