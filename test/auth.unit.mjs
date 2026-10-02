import assert from 'node:assert/strict';
import test from 'node:test';

import { Prisma } from '@prisma/client';

import { AuthService } from '../dist/api-modules/auth/auth.service.js';
import { BusinessEmailDomainService } from '../dist/api-modules/auth/business-email-domain.service.js';
import { PasswordService } from '../dist/api-modules/auth/password.service.js';
import { AuthenticationGuard } from '../dist/api-modules/auth/guards/authentication.guard.js';

function createFixture() {
  const state = { credentials: new Map(), organizations: new Map(), users: new Map(), nextId: 1 };
  const notificationService = {
    messages: [],
    async send(message) {
      this.messages.push(message);
    },
  };
  const passwordService = {
    async hash(password) {
      return `hashed:${password}`;
    },
    async verify(password, hash) {
      return hash === `hashed:${password}`;
    },
  };
  const tokenService = {
    nextToken: 0,
    async createAccessToken(user) {
      return `access:${user.id}`;
    },
    createOpaqueToken() {
      this.nextToken += 1;
      return `verification-token-${this.nextToken}`.padEnd(40, 'x');
    },
    getRefreshTokenExpiration() {
      return new Date(Date.now() + 60_000);
    },
    getVerificationTokenExpiration() {
      return new Date(Date.now() + 60_000);
    },
    hashOpaqueToken(token) {
      return `hash:${token}`;
    },
  };
  const withCredentials = (user) => ({
    ...user,
    credentials: state.credentials.get(user.id) ?? null,
  });
  const prisma = {
    async $transaction(callback) {
      return callback(this);
    },
    organization: {
      async upsert({ where, create }) {
        const current = state.organizations.get(where.emailDomain);
        if (current) return current;
        const organization = { id: `organization-${state.nextId++}`, ...create };
        state.organizations.set(where.emailDomain, organization);
        return organization;
      },
    },
    user: {
      async create({ data }) {
        if (state.users.has(data.email)) {
          throw new Prisma.PrismaClientKnownRequestError('duplicate email', {
            code: 'P2002',
            clientVersion: 'test',
          });
        }
        const user = { id: `user-${state.nextId++}`, ...data, credentials: undefined };
        delete user.credentials;
        state.users.set(user.email, user);
        const credentials = {
          id: `credentials-${state.nextId++}`,
          userId: user.id,
          ...data.credentials.create,
        };
        state.credentials.set(user.id, credentials);
        return user;
      },
      async findUnique({ where, include }) {
        const user = where.email
          ? state.users.get(where.email)
          : [...state.users.values()].find((value) => value.id === where.id);
        return user && include?.credentials ? withCredentials(user) : (user ?? null);
      },
      async update({ where, data }) {
        const user = [...state.users.values()].find((value) => value.id === where.id);
        Object.assign(user, data);
        return user;
      },
    },
    userCredentials: {
      async findUnique({ where, include }) {
        const credentials = where.userId
          ? state.credentials.get(where.userId)
          : where.verificationTokenHash
            ? [...state.credentials.values()].find(
                (value) => value.verificationTokenHash === where.verificationTokenHash,
              )
            : [...state.credentials.values()].find(
                (value) => value.refreshTokenHash === where.refreshTokenHash,
              );
        if (!credentials) return null;
        const user = [...state.users.values()].find((value) => value.id === credentials.userId);
        return include?.user ? { ...credentials, user } : credentials;
      },
      async update({ where, data }) {
        const credentials = where.id
          ? [...state.credentials.values()].find((value) => value.id === where.id)
          : state.credentials.get(where.userId);
        Object.assign(credentials, data);
        return credentials;
      },
      async updateMany({ where, data }) {
        for (const credentials of state.credentials.values()) {
          if (credentials.refreshTokenHash === where.refreshTokenHash)
            Object.assign(credentials, data);
        }
      },
    },
  };
  const service = new AuthService(
    prisma,
    new BusinessEmailDomainService(),
    passwordService,
    tokenService,
    notificationService,
  );
  return { notificationService, prisma, service, state, tokenService };
}

function registration(email = 'malinda@openprovider.com', organizationName = 'OpenProvider') {
  return { name: 'Malinda', email, password: 'secure-password', organizationName };
}

test('registration normalizes a business email, creates an organization, and isolates credentials', async () => {
  const { notificationService, service, state } = createFixture();
  const result = await service.register(registration('Malinda@OpenProvider.com'));

  const user = state.users.get('malinda@openprovider.com');
  const credentials = state.credentials.get(user.id);
  assert.equal(result.user.email, 'malinda@openprovider.com');
  assert.equal(state.organizations.get('openprovider.com').name, 'OpenProvider');
  assert.equal(credentials.passwordHash, 'hashed:secure-password');
  assert.equal('passwordHash' in user, false);
  assert.equal('credentials' in result.user, false);
  assert.equal('token' in result, false);
  assert.equal(notificationService.messages.length, 1);
  assert.notEqual(credentials.verificationTokenHash, notificationService.messages[0].token);
});

test('existing domain registration reuses its organization without changing its name', async () => {
  const { service, state } = createFixture();
  await service.register(registration());
  await service.register(registration('kasun@openprovider.com', 'Attempted rename'));

  const firstUser = state.users.get('malinda@openprovider.com');
  const secondUser = state.users.get('kasun@openprovider.com');
  assert.equal(state.organizations.size, 1);
  assert.equal(secondUser.organizationId, firstUser.organizationId);
  assert.equal(state.organizations.get('openprovider.com').name, 'OpenProvider');
});

test('personal email providers are rejected on registration', async () => {
  for (const domain of ['gmail.com', 'outlook.com', 'hotmail.com', 'proton.me']) {
    const { service } = createFixture();
    await assert.rejects(service.register(registration(`user@${domain}`)), {
      code: 'PERSONAL_EMAIL_NOT_ALLOWED',
    });
  }
});

test('duplicate normalized email is rejected', async () => {
  const { service } = createFixture();
  await service.register(registration());
  await assert.rejects(service.register(registration('MALINDA@OPENPROVIDER.COM')), {
    code: 'EMAIL_ALREADY_REGISTERED',
  });
});

test('verification accepts valid tokens and rejects expired, invalid, and reused tokens', async () => {
  const { notificationService, service, state } = createFixture();
  await service.register(registration());
  const token = notificationService.messages[0].token;
  assert.deepEqual(await service.verifyEmail(token), { verified: true });
  assert.equal(state.users.get('malinda@openprovider.com').emailVerified, true);
  await assert.rejects(service.verifyEmail(token), { code: 'EMAIL_ALREADY_VERIFIED' });
  await assert.rejects(service.verifyEmail('invalid-token'.padEnd(40, 'x')), {
    code: 'INVALID_VERIFICATION_TOKEN',
  });

  const expired = createFixture();
  await expired.service.register(registration());
  const user = expired.state.users.get('malinda@openprovider.com');
  expired.state.credentials.get(user.id).verificationTokenExpiresAt = new Date(0);
  await assert.rejects(expired.service.verifyEmail(expired.notificationService.messages[0].token), {
    code: 'VERIFICATION_TOKEN_EXPIRED',
  });
});

test('resend replaces an unverified credential token without revealing account state', async () => {
  const { notificationService, service, state } = createFixture();
  await service.register(registration());
  const user = state.users.get('malinda@openprovider.com');
  const originalHash = state.credentials.get(user.id).verificationTokenHash;
  assert.deepEqual(await service.resendVerification('MALINDA@OPENPROVIDER.COM'), {
    verificationRequired: true,
  });
  assert.equal(notificationService.messages.length, 2);
  assert.notEqual(state.credentials.get(user.id).verificationTokenHash, originalHash);
  assert.deepEqual(await service.resendVerification('unknown@openprovider.com'), {
    verificationRequired: true,
  });
});

test('login loads credentials, enforces account state, and stores only a hashed refresh token', async () => {
  const { notificationService, service, state } = createFixture();
  await service.register(registration());
  const user = state.users.get('malinda@openprovider.com');
  await assert.rejects(service.login({ email: user.email, password: 'secure-password' }), {
    code: 'EMAIL_NOT_VERIFIED',
  });
  await service.verifyEmail(notificationService.messages[0].token);
  const result = await service.login({ email: user.email, password: 'secure-password' });
  assert.equal(result.user.id, user.id);
  assert.equal(state.credentials.get(user.id).refreshTokenHash, `hash:${result.refreshToken}`);
  assert.equal('passwordHash' in result.user, false);
  await assert.rejects(service.login({ email: user.email, password: 'wrong-password' }), {
    code: 'INVALID_CREDENTIALS',
  });
  await assert.rejects(
    service.login({ email: 'unknown@openprovider.com', password: 'wrong-password' }),
    { code: 'INVALID_CREDENTIALS' },
  );
  user.status = 'INACTIVE';
  await assert.rejects(service.login({ email: user.email, password: 'secure-password' }), {
    code: 'ACCOUNT_DISABLED',
  });
});

test('verifies the authenticated user password without exposing its credential hash', async () => {
  const { service, state } = createFixture();
  await service.register(registration());
  const user = state.users.get('malinda@openprovider.com');

  await service.verifyCurrentPassword(user.id, 'secure-password');
  await assert.rejects(service.verifyCurrentPassword(user.id, 'wrong-password'), {
    code: 'INVALID_CREDENTIALS',
  });
});

test('refresh rotates credentials and logout revokes the persisted refresh hash', async () => {
  const { notificationService, service, state } = createFixture();
  await service.register(registration());
  await service.verifyEmail(notificationService.messages[0].token);
  const first = await service.login({
    email: 'malinda@openprovider.com',
    password: 'secure-password',
  });
  const second = await service.refresh(first.refreshToken);
  assert.notEqual(second.refreshToken, first.refreshToken);
  await assert.rejects(service.refresh(first.refreshToken), { code: 'INVALID_REFRESH_TOKEN' });
  await service.logout(second.refreshToken);
  const user = state.users.get('malinda@openprovider.com');
  assert.equal(state.credentials.get(user.id).refreshTokenHash, null);
});

test('authentication guard places the user and organization identity on the request context', async () => {
  const guard = new AuthenticationGuard(
    {
      async getAuthenticatedUser() {
        return { id: 'user-1', organizationId: 'organization-1', role: 'HR' };
      },
    },
    {
      async verifyAccessToken() {
        return { sub: 'user-1' };
      },
    },
  );
  const request = { headers: { authorization: 'Bearer access-token' }, cookies: {} };
  const context = { switchToHttp: () => ({ getRequest: () => request }) };
  assert.equal(await guard.canActivate(context), true);
  assert.deepEqual(request.user, { id: 'user-1', organizationId: 'organization-1', role: 'HR' });
  await assert.rejects(
    new AuthenticationGuard({}, {}).canActivate({
      switchToHttp: () => ({ getRequest: () => ({ headers: {}, cookies: {} }) }),
    }),
    { code: 'UNAUTHORIZED' },
  );
});

test('password service derives and verifies a non-plaintext password hash', async () => {
  const service = new PasswordService();
  const hash = await service.hash('secure-password');
  assert.notEqual(hash, 'secure-password');
  assert.equal(await service.verify('secure-password', hash), true);
  assert.equal(await service.verify('other-password', hash), false);
});
