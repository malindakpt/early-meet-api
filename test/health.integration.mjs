import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.WEB_APP_URL = 'http://localhost:3000';
process.env.EMAIL_FROM = 'no-reply@example.com';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USERNAME = 'test-user';
process.env.SMTP_PASSWORD = 'test-password';
process.env.AUTH_SECRET = 'test-auth-secret-that-is-at-least-thirty-two-characters';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_CANDIDATE_EVALUATION_MODEL = 'test-model';
process.env.OPENAI_CV_EXTRACTION_MODEL = 'test-model';
process.env.OPENAI_TIMEOUT_MS = '30000';

const { Test } = await import('@nestjs/testing');
const { AppModule } = await import('../dist/app.module.js');
const { configureApplication } = await import('../dist/app.setup.js');
const { PrismaService } = await import('../dist/infrastructure/prisma/prisma.service.js');

async function createApplication(queryRaw) {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ $queryRaw: queryRaw })
    .compile();
  const app = module.createNestApplication();

  app.useLogger(false);
  await configureApplication(app);
  await app.init();

  return app;
}

test('GET /api/v1/health returns the standard response envelope', async (context) => {
  const app = await createApplication(async () => [{ '?column?': 1 }]);
  context.after(async () => app.close());

  const response = await request(app.getHttpServer())
    .get('/api/v1/health')
    .set('Origin', 'http://localhost:3000')
    .expect(200);

  assert.deepEqual(response.body.data, { status: 'ok', database: 'connected' });
  assert.match(response.body.meta.requestId, /^req_/);
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:3000');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-request-id'], response.body.meta.requestId);
});

test('GET /api/v1/health returns 503 when the database is unavailable', async (context) => {
  const app = await createApplication(async () => {
    throw new Error('Database unavailable');
  });
  context.after(async () => app.close());

  const response = await request(app.getHttpServer()).get('/api/v1/health').expect(503);

  assert.equal(response.body.code, 'DATABASE_UNAVAILABLE');
  assert.equal(response.body.detail, 'The database is unavailable.');
  assert.equal(response.body.title, 'Service unavailable');
  assert.match(response.body.requestId, /^req_/);
});

test('GET /api/v1/health/live succeeds without querying the database', async (context) => {
  const app = await createApplication(async () => {
    throw new Error('Liveness must not query the database');
  });
  context.after(async () => app.close());

  const response = await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);

  assert.deepEqual(response.body.data, { status: 'ok' });
  assert.match(response.body.meta.requestId, /^req_/);
});

test('unknown routes return a request-correlated problem response', async (context) => {
  const app = await createApplication(async () => [{ '?column?': 1 }]);
  context.after(async () => app.close());

  const response = await request(app.getHttpServer()).get('/api/v1/not-found').expect(404);

  assert.equal(response.body.code, 'NOT-FOUND');
  assert.equal(response.body.status, 404);
  assert.equal(response.body.title, 'Not found');
  assert.match(response.body.requestId, /^req_/);
  assert.equal(response.headers['x-request-id'], response.body.requestId);
});
