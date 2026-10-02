import assert from 'node:assert/strict';
import test from 'node:test';

import { InterviewService } from '../dist/api-modules/interviews/interview.service.js';

const organizationOneUser = { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
const organizationTwoUser = { id: 'user-2', organizationId: 'organization-2', role: 'HR' };

function createFixture() {
  const state = { invitations: new Map(), nextInvitationId: 1, tokenCalls: 0 };
  const associations = new Map([
    [
      'vacancy-candidate-1',
      {
        id: 'vacancy-candidate-1',
        vacancyId: 'vacancy-1',
        candidateId: 'candidate-1',
        organizationId: 'organization-1',
      },
    ],
    [
      'vacancy-candidate-2',
      {
        id: 'vacancy-candidate-2',
        vacancyId: 'vacancy-2',
        candidateId: 'candidate-2',
        organizationId: 'organization-2',
      },
    ],
  ]);
  const notFound = (message) => Object.assign(new Error(message), { status: 404 });
  const vacancyCandidateService = {
    async findOne(user, vacancyId, vacancyCandidateId) {
      const association = associations.get(vacancyCandidateId);
      if (
        association === undefined ||
        association.vacancyId !== vacancyId ||
        association.organizationId !== user.organizationId
      ) {
        throw notFound('Vacancy candidate not found.');
      }
      return association;
    },
  };
  const withRelations = (invitation) => ({
    ...invitation,
    candidate: {
      id: invitation.candidateId,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+94111234567',
      status: 'ACTIVE',
    },
    vacancy: { id: invitation.vacancyId, title: 'Backend Engineer', status: 'ACTIVE' },
  });
  const prisma = {
    interviewInvitation: {
      async create({ data }) {
        const invitation = {
          id: `invitation-${state.nextInvitationId++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          sentAt: null,
          ...data,
        };
        state.invitations.set(invitation.id, invitation);
        return withRelations(invitation);
      },
      async findMany({ where }) {
        return [...state.invitations.values()]
          .filter(
            (invitation) =>
              invitation.vacancyId === where.vacancyId &&
              invitation.candidateId === where.candidateId,
          )
          .map(withRelations);
      },
      async findFirst({ where }) {
        const invitation = state.invitations.get(where.id);
        return invitation !== undefined &&
          invitation.vacancyId === where.vacancyId &&
          invitation.candidateId === where.candidateId
          ? withRelations(invitation)
          : null;
      },
      async update({ where, data }) {
        const invitation = state.invitations.get(where.id);
        Object.assign(invitation, data, { updatedAt: new Date() });
        return withRelations(invitation);
      },
    },
  };
  const authTokenService = {
    createOpaqueToken() {
      state.tokenCalls += 1;
      return 'opaque-invitation-token';
    },
    hashOpaqueToken(token) {
      return `hash:${token}`;
    },
  };
  const vacancyService = {
    async findOne(user, vacancyId) {
      const vacancy = [...associations.values()].find(
        (association) => association.vacancyId === vacancyId,
      );
      if (vacancy === undefined || vacancy.organizationId !== user.organizationId) {
        throw notFound('Vacancy not found.');
      }
      return { ...vacancy };
    },
  };
  return {
    service: new InterviewService(
      prisma,
      vacancyCandidateService,
      authTokenService,
      undefined,
      vacancyService,
    ),
    state,
  };
}

test('creates a pending interview invitation for an authorized vacancy candidate without exposing its token hash', async () => {
  const { service, state } = createFixture();
  const response = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  assert.equal(response.status, 'PENDING');
  assert.equal(response.candidateId, 'candidate-1');
  assert.equal(response.vacancyId, 'vacancy-1');
  assert.equal(response.createdBy, 'user-1');
  assert.equal('tokenHash' in response, false);
  assert.equal(state.invitations.get(response.id).tokenHash, 'hash:opaque-invitation-token');
  assert.equal(state.tokenCalls, 1);
});

test('supports multiple invitations and scopes listing and retrieval through the vacancy candidate', async () => {
  const { service } = createFixture();
  const first = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const second = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');

  assert.equal(
    (await service.findAll(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1')).length,
    2,
  );
  assert.equal(
    (await service.findOne(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', first.id)).id,
    first.id,
  );
  await assert.rejects(
    service.findOne(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', 'missing-invitation'),
    { status: 404 },
  );
  await assert.rejects(
    service.findOne(organizationTwoUser, 'vacancy-2', 'vacancy-candidate-2', second.id),
    { status: 404 },
  );
});

test('rejects unauthorized or mismatched vacancy candidates before creating an interview', async () => {
  const { service, state } = createFixture();
  await assert.rejects(service.create(organizationTwoUser, 'vacancy-1', 'vacancy-candidate-1'), {
    status: 404,
  });
  await assert.rejects(service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-2'), {
    status: 404,
  });
  assert.equal(state.invitations.size, 0);
});

test('allows HR to cancel only pending interview invitations', async () => {
  const { service, state } = createFixture();
  const invitation = await service.create(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1');
  const cancelled = await service.update(
    organizationOneUser,
    'vacancy-1',
    'vacancy-candidate-1',
    invitation.id,
    { status: 'CANCELLED' },
  );
  assert.equal(cancelled.status, 'CANCELLED');

  await assert.rejects(
    service.update(organizationOneUser, 'vacancy-1', 'vacancy-candidate-1', invitation.id, {
      status: 'COMPLETED',
    }),
    { status: 409 },
  );
  assert.equal(state.invitations.get(invitation.id).status, 'CANCELLED');
});
