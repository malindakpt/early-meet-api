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
const { AuthService } = await import('../dist/api-modules/auth/auth.service.js');
const { AuthTokenService } = await import('../dist/api-modules/auth/auth-token.service.js');
const { TechnologyService } =
  await import('../dist/api-modules/technologies/technology.service.js');
const { TechnologySegmentService } =
  await import('../dist/api-modules/technology-segments/technology-segment.service.js');
const { QuestionService } = await import('../dist/api-modules/questions/question.service.js');
const { VacancyTechnologyService } =
  await import('../dist/api-modules/vacancy-technologies/vacancy-technology.service.js');
const { VacancyQuestionGenerationService } =
  await import('../dist/api-modules/vacancy-question-generation/vacancy-question-generation.service.js');
const { VacancyQuestionSetService } =
  await import('../dist/api-modules/vacancy-question-generation/vacancy-question-set.service.js');
const { CandidateService } = await import('../dist/api-modules/candidates/candidate.service.js');
const { VacancyCandidateService } =
  await import('../dist/api-modules/vacancy-candidates/vacancy-candidate.service.js');
const { CandidateRankingService } =
  await import('../dist/api-modules/vacancy-candidates/candidate-ranking.service.js');
const { CandidateVacancyMatchingService } =
  await import('../dist/api-modules/candidate-matching/candidate-vacancy-matching.service.js');
const { InterviewService } = await import('../dist/api-modules/interviews/interview.service.js');
const { InterviewAnswerEvaluationService } =
  await import('../dist/api-modules/interviews/interview-answer-evaluation.service.js');
const { InterviewFollowUpService } =
  await import('../dist/api-modules/interviews/interview-follow-up.service.js');
const { InterviewOverallEvaluationService } =
  await import('../dist/api-modules/interviews/interview-overall-evaluation.service.js');

async function createApplication(role = 'HR') {
  const authService = {
    async getAuthenticatedUser(userId) {
      return userId === 'user-1' ? { id: 'user-1', organizationId: 'organization-1', role } : null;
    },
    async getMe(userId) {
      return {
        id: userId,
        name: 'Malinda',
        email: 'malinda@openprovider.com',
        organizationId: 'organization-1',
        role,
        emailVerified: true,
      };
    },
    async verifyCurrentPassword(_userId, password) {
      if (password !== 'correct-password') {
        const error = new Error('Incorrect password.');
        error.status = 401;
        throw error;
      }
    },
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AuthService)
    .useValue(authService)
    .overrideProvider(TechnologyService)
    .useValue({
      async findAll() {
        return [
          { id: 'technology-1', name: 'TypeScript', description: 'Language', status: 'ACTIVE' },
        ];
      },
    })
    .overrideProvider(TechnologySegmentService)
    .useValue({
      async findAllAcrossTechnologies() {
        return [
          {
            id: 'segment-1',
            technologyId: 'technology-1',
            name: 'Fundamentals',
            description: 'Core concepts',
            status: 'ACTIVE',
          },
        ];
      },
      async findAll() {
        return [
          {
            id: 'segment-1',
            technologyId: 'technology-1',
            name: 'Fundamentals',
            description: 'Core concepts',
            status: 'ACTIVE',
          },
        ];
      },
    })
    .overrideProvider(QuestionService)
    .useValue({
      async importCsv() {
        return { importedCount: 1 };
      },
      async findAll(query) {
        return [
          {
            id: 'question-1',
            technologyId: query.technologyId ?? 'technology-1',
            technologySegmentId: 'segment-1',
            difficulty: 'INTERMEDIATE',
            questionType: 'OPEN_ENDED',
            followUpAllowed: true,
            status: 'ACTIVE',
            questionText: 'Explain generic constraints.',
            evaluationCriteria: { accuracy: 'Correct explanation' },
            metaData: { topic: 'generics' },
          },
        ];
      },
      async previewCsvImport() {
        return { errors: [], rows: [], totalRows: 1, validRows: 1 };
      },
    })
    .overrideProvider(VacancyTechnologyService)
    .useValue({
      async findAll() {
        return [
          {
            id: 'vacancy-technology-1',
            vacancyId: 'vacancy-1',
            technologyId: 'technology-1',
            requirementType: 'REQUIRED',
            technology: {
              id: 'technology-1',
              name: 'TypeScript',
              description: 'Language',
              status: 'ACTIVE',
            },
          },
        ];
      },
    })
    .overrideProvider(VacancyQuestionGenerationService)
    .useValue({
      async generate(_user, vacancyId) {
        return {
          vacancyId,
          generatedCount: 1,
          questions: [{ id: 'vacancy-question-1', questionId: 'question-1', sequence: 1 }],
        };
      },
    })
    .overrideProvider(VacancyQuestionSetService)
    .useValue({
      async findAll() {
        return [];
      },
      async add(_user, vacancyId, dto) {
        return { id: 'vacancy-question-1', vacancyId, ...dto, sequence: 1 };
      },
      async update(_user, _vacancyId, vacancyQuestionId, dto) {
        return { id: vacancyQuestionId, ...dto };
      },
      async remove() {},
    })
    .overrideProvider(CandidateService)
    .useValue({
      async create(dto) {
        return { id: 'candidate-1', ...dto };
      },
      async findOne(candidateId) {
        return {
          id: candidateId,
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          phone: '+94111234567',
          status: 'ACTIVE',
        };
      },
    })
    .overrideProvider(VacancyCandidateService)
    .useValue({
      async uploadCvs(_user, _vacancyId, dto) {
        return {
          items: dto.candidates.map((candidate, index) => ({
            candidateId: `candidate-${index + 1}`,
            fileName: candidate.fileName,
            status: 'CREATED',
          })),
        };
      },
      async create(_user, vacancyId, dto) {
        return {
          id: 'vacancy-candidate-1',
          vacancyId,
          candidateId: 'candidate-1',
          vacancyMatchScore: 0,
          requiredTechnologiesMet: [],
          preferredTechnologiesMet: [],
          strengths: [],
          gaps: [],
          decision: 'KEEP_IN_REVIEW',
          summary: '',
          notes: '',
          candidate: { id: 'candidate-1', ...dto },
        };
      },
      async findAll(_user, vacancyId) {
        return {
          items: [
            {
              id: 'vacancy-candidate-1',
              vacancyId,
              candidateId: 'candidate-1',
              vacancyMatchScore: 80,
              requiredTechnologiesMet: ['TypeScript'],
              preferredTechnologiesMet: [],
              strengths: ['Relevant TypeScript experience.'],
              gaps: [],
              decision: 'SHORTLISTED',
              summary: 'Strong technical evidence.',
              notes: '',
              candidate: {
                id: 'candidate-1',
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                processingStatus: 'READY',
              },
            },
          ],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
        };
      },
    })
    .overrideProvider(CandidateRankingService)
    .useValue({
      async findAll(_user, _vacancyId, query) {
        return {
          rankedCandidates: [],
          notEvaluatedCandidates: [],
          pagination: { page: query.page ?? 1, limit: query.limit ?? 25, total: 0, totalPages: 0 },
        };
      },
    })
    .overrideProvider(CandidateVacancyMatchingService)
    .useValue({
      async match(_user, vacancyId, vacancyCandidateId) {
        return {
          id: vacancyCandidateId,
          vacancyId,
          candidateId: 'candidate-1',
          vacancyMatchScore: 100,
          requiredTechnologiesMet: ['TypeScript'],
          preferredTechnologiesMet: [],
          strengths: [],
          gaps: [],
          decision: 'KEEP_IN_REVIEW',
          summary: '',
          notes: '',
          candidate: { id: 'candidate-1' },
        };
      },
    })
    .overrideProvider(InterviewService)
    .useValue({
      async create(_user, vacancyId) {
        return {
          id: 'invitation-1',
          candidateId: 'candidate-1',
          vacancyId,
          createdBy: 'user-1',
          status: 'PENDING',
          sentAt: null,
          expiresAt: new Date('2026-09-06T12:00:00.000Z'),
          createdAt: new Date('2026-08-30T12:00:00.000Z'),
          updatedAt: new Date('2026-08-30T12:00:00.000Z'),
          candidate: { id: 'candidate-1', name: 'Ada Lovelace', email: 'ada@example.com' },
          vacancy: { id: vacancyId, title: 'Backend Engineer', status: 'ACTIVE' },
        };
      },
      async start(_user, _vacancyId, _vacancyCandidateId, interviewId) {
        return {
          interviewId,
          sessionId: 'session-1',
          status: 'IN_PROGRESS',
          answeredQuestionCount: 0,
          totalCoreQuestionCount: 1,
          isComplete: false,
          currentQuestion: { id: 'interview-question-1', sequence: 1, questionText: 'Explain DI.' },
        };
      },
      async getProgress(_user, _vacancyId, _vacancyCandidateId, interviewId) {
        return {
          interviewId,
          sessionId: 'session-1',
          status: 'IN_PROGRESS',
          answeredQuestionCount: 0,
          totalCoreQuestionCount: 1,
          isComplete: false,
          currentQuestion: { id: 'interview-question-1', sequence: 1, questionText: 'Explain DI.' },
        };
      },
      async submitAnswer(_user, _vacancyId, _vacancyCandidateId, interviewId, dto) {
        return {
          interviewId,
          sessionId: 'session-1',
          status: 'COMPLETED',
          answeredQuestionCount: 1,
          totalCoreQuestionCount: 1,
          isComplete: true,
          currentQuestion: null,
          submittedQuestionId: dto.interviewQuestionId,
        };
      },
    })
    .overrideProvider(InterviewAnswerEvaluationService)
    .useValue({
      async evaluate(_user, _vacancyId, _vacancyCandidateId, _interviewId, answerId) {
        return {
          answerId,
          score: 82,
          explanation: 'Correctly identifies composition-root dependency wiring.',
        };
      },
    })
    .overrideProvider(InterviewFollowUpService)
    .useValue({
      async decide() {
        return {
          shouldFollowUp: false,
          reason: 'The answer is sufficiently complete.',
          followUpQuestion: null,
        };
      },
    })
    .overrideProvider(InterviewOverallEvaluationService)
    .useValue({
      async evaluate(_user, _vacancyId, _vacancyCandidateId, interviewId) {
        return {
          interviewId,
          overallScore: 82,
          summary: 'Consistent core-question performance.',
          evaluatedAt: new Date('2026-08-30T12:00:00.000Z'),
        };
      },
      async findOne(_user, _vacancyId, _vacancyCandidateId, interviewId) {
        return {
          interviewId,
          overallScore: 82,
          summary: 'Consistent core-question performance.',
          evaluatedAt: new Date('2026-08-30T12:00:00.000Z'),
        };
      },
    })
    .compile();
  const app = module.createNestApplication();
  app.useLogger(false);
  await configureApplication(app);
  await app.init();
  return app;
}

test('GET /api/v1/auth/me rejects unauthenticated requests', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const response = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  assert.equal(response.body.code, 'UNAUTHORIZED');
});

test('GET /api/v1/auth/me returns the guarded user and organization context', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });

  const response = await request(app.getHttpServer())
    .get('/api/v1/auth/me')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);

  assert.equal(response.body.data.user.organizationId, 'organization-1');
  assert.equal(response.body.data.user.role, 'HR');
  assert.equal('passwordHash' in response.body.data.user, false);
  assert.match(response.body.meta.requestId, /^req_/);
});

test('POST /api/v1/vacancies requires authentication', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const response = await request(app.getHttpServer())
    .post('/api/v1/vacancies')
    .send({})
    .expect(401);
  assert.equal(response.body.code, 'UNAUTHORIZED');
});

test('POST /api/v1/vacancies rejects invalid payloads before persistence', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });

  const response = await request(app.getHttpServer())
    .post('/api/v1/vacancies')
    .set('Cookie', `access_token=${accessToken}`)
    .send({ title: '' })
    .expect(400);

  assert.equal(response.body.code, 'VALIDATION-ERROR');
});

test('Technology routes require the platform administrator role', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });

  const response = await request(app.getHttpServer())
    .get('/api/v1/technologies')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(403);

  assert.equal(response.body.code, 'FORBIDDEN');
});

test('Technology routes permit admins and reject system-managed request fields', async (context) => {
  const app = await createApplication('PLATFORM_ADMIN');
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'PLATFORM_ADMIN',
  });

  const listResponse = await request(app.getHttpServer())
    .get('/api/v1/technologies')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);
  assert.equal(listResponse.body.data[0].name, 'TypeScript');

  const invalidResponse = await request(app.getHttpServer())
    .post('/api/v1/technologies')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      id: 'client-controlled-id',
      name: 'TypeScript',
      description: 'Language',
      status: 'ACTIVE',
    })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');
});

test('TechnologySegment routes require the platform administrator role', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });

  const response = await request(app.getHttpServer())
    .post('/api/v1/technologies/technology-1/segments')
    .set('Cookie', `access_token=${accessToken}`)
    .send({})
    .expect(403);

  assert.equal(response.body.code, 'FORBIDDEN');

  await request(app.getHttpServer())
    .get('/api/v1/technology-segments')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(403);
});

test('TechnologySegment routes permit admins and reject immutable request fields', async (context) => {
  const app = await createApplication('PLATFORM_ADMIN');
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'PLATFORM_ADMIN',
  });

  const listResponse = await request(app.getHttpServer())
    .get('/api/v1/technologies/technology-1/segments')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);
  assert.equal(listResponse.body.data[0].technologyId, 'technology-1');

  const collectionResponse = await request(app.getHttpServer())
    .get('/api/v1/technology-segments')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);
  assert.equal(collectionResponse.body.data[0].name, 'Fundamentals');

  const invalidResponse = await request(app.getHttpServer())
    .post('/api/v1/technologies/technology-1/segments')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      id: 'client-controlled-id',
      technologyId: 'technology-2',
      name: 'Fundamentals',
      description: 'Core concepts',
      status: 'ACTIVE',
    })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');
});

test('Question routes require the platform administrator role', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });

  const response = await request(app.getHttpServer())
    .post('/api/v1/questions')
    .set('Cookie', `access_token=${accessToken}`)
    .send({})
    .expect(403);

  assert.equal(response.body.code, 'FORBIDDEN');

  await request(app.getHttpServer())
    .post('/api/v1/questions/import/preview')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      csv: 'question,technology,technologySegment,difficulty,evaluationCriteria,allowFollowUp',
    })
    .expect(403);
});

test('Question routes permit admins, bind filters, and reject system-managed fields', async (context) => {
  const app = await createApplication('PLATFORM_ADMIN');
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'PLATFORM_ADMIN',
  });

  const listResponse = await request(app.getHttpServer())
    .get('/api/v1/questions?technologyId=11111111-1111-4111-8111-111111111111&status=ACTIVE')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);
  assert.equal(listResponse.body.data[0].technologyId, '11111111-1111-4111-8111-111111111111');

  const invalidResponse = await request(app.getHttpServer())
    .post('/api/v1/questions')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      id: 'client-controlled-id',
      technologyId: '11111111-1111-4111-8111-111111111111',
      technologySegmentId: '22222222-2222-4222-8222-222222222222',
      difficulty: 'INTERMEDIATE',
      questionType: 'OPEN_ENDED',
      followUpAllowed: true,
      status: 'ACTIVE',
      questionText: 'Explain generic constraints.',
      evaluationCriteria: { accuracy: 'Correct explanation' },
      metaData: { topic: 'generics' },
    })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');

  const previewResponse = await request(app.getHttpServer())
    .post('/api/v1/questions/import/preview')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      csv: 'question,technology,technologySegment,difficulty,evaluationCriteria,allowFollowUp',
    })
    .expect(201);
  assert.equal(previewResponse.body.data.validRows, 1);

  const importResponse = await request(app.getHttpServer())
    .post('/api/v1/questions/import')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      csv: 'question,technology,technologySegment,difficulty,evaluationCriteria,allowFollowUp',
      password: 'correct-password',
    })
    .expect(201);
  assert.equal(importResponse.body.data.importedCount, 1);
});

test('VacancyTechnology routes require authentication', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const response = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/technologies')
    .send({})
    .expect(401);

  assert.equal(response.body.code, 'UNAUTHORIZED');
});

test('VacancyTechnology routes accept authenticated lists and reject immutable or invalid fields', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });

  const listResponse = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/technologies')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);
  assert.equal(listResponse.body.data[0].technology.name, 'TypeScript');

  const invalidResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/technologies')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      id: 'client-controlled-id',
      vacancyId: 'other-vacancy',
      technologyId: '11111111-1111-4111-8111-111111111111',
      requirementType: 'INVALID',
    })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');
});

test('Vacancy Question Generation requires authentication and permits authorized HR users', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/questions/generate')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const response = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/questions/generate')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(201);

  assert.deepEqual(response.body.data, {
    vacancyId: 'vacancy-1',
    generatedCount: 1,
    questions: [{ id: 'vacancy-question-1', questionId: 'question-1', sequence: 1 }],
  });
});

test('Vacancy question set routes require authentication and validate selected bank question IDs', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/questions')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const invalidResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/questions')
    .set('Cookie', `access_token=${accessToken}`)
    .send({ questionId: 'not-a-uuid' })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');
});

test('Direct candidate routes are unavailable; candidate management is vacancy-scoped', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  await request(app.getHttpServer()).post('/api/v1/candidates').expect(404);
  await request(app.getHttpServer()).get('/api/v1/candidates/candidate-1').expect(404);
});

test('VacancyCandidate routes require authentication and reject immutable fields', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const createdResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+94111234567',
      status: 'ACTIVE',
    })
    .expect(201);
  assert.equal(createdResponse.body.data.candidate.email, 'ada@example.com');

  const invalidResponse = await request(app.getHttpServer())
    .patch('/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      candidateId: 'other-candidate',
      vacancyId: 'other-vacancy',
      id: 'client-controlled-id',
    })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');
});

test('Candidate review listing requires authentication and returns paginated review data', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/candidates')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const response = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/candidates?page=1&limit=25&sortBy=matchScore')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);

  assert.equal(response.body.data.items[0].candidate.processingStatus, 'READY');
  assert.equal(response.body.data.pagination.total, 1);

  const invalidQueryResponse = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/candidates?limit=101&sortBy=databaseField')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(400);
  assert.equal(invalidQueryResponse.body.code, 'VALIDATION-ERROR');
});

test('Candidate ranking requires authentication and validates ranking pagination', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/candidates/ranking')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const response = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/candidates/ranking?page=1&limit=25')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(200);
  assert.equal(response.body.data.pagination.total, 0);

  const invalidQueryResponse = await request(app.getHttpServer())
    .get('/api/v1/vacancies/vacancy-1/candidates/ranking?limit=101')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(400);
  assert.equal(invalidQueryResponse.body.code, 'VALIDATION-ERROR');
});

test('Candidate-vacancy matching route requires authentication and returns the matching result', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/match')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const response = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/match')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(201);

  assert.equal(response.body.data.vacancyMatchScore, 100);
  assert.deepEqual(response.body.data.requiredTechnologiesMet, ['TypeScript']);
});

test('Interview creation requires authentication and returns a pending invitation', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const response = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews')
    .set('Cookie', `access_token=${accessToken}`)
    .expect(201);

  assert.equal(response.body.data.status, 'PENDING');
  assert.equal('tokenHash' in response.body.data, false);
});

test('Interview execution routes require authentication and validate answer payloads', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews/interview-1/start')
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const invalidResponse = await request(app.getHttpServer())
    .post(
      '/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews/interview-1/answers',
    )
    .set('Cookie', `access_token=${accessToken}`)
    .send({ interviewQuestionId: 'not-a-uuid', answerText: '' })
    .expect(400);
  assert.equal(invalidResponse.body.code, 'VALIDATION-ERROR');
});

test('Interview answer evaluation route requires authentication', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const response = await request(app.getHttpServer())
    .post(
      '/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews/interview-1/answers/answer-1/evaluate',
    )
    .expect(401);
  assert.equal(response.body.code, 'UNAUTHORIZED');
});

test('Interview follow-up decision route requires authentication', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const response = await request(app.getHttpServer())
    .post(
      '/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews/interview-1/answers/answer-1/follow-up',
    )
    .expect(401);
  assert.equal(response.body.code, 'UNAUTHORIZED');
});

test('Overall interview evaluation routes require authentication', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());
  const path = '/api/v1/vacancies/vacancy-1/candidates/vacancy-candidate-1/interviews/interview-1';

  const generateResponse = await request(app.getHttpServer()).post(`${path}/evaluate`).expect(401);
  assert.equal(generateResponse.body.code, 'UNAUTHORIZED');

  const retrieveResponse = await request(app.getHttpServer()).get(`${path}/evaluation`).expect(401);
  assert.equal(retrieveResponse.body.code, 'UNAUTHORIZED');
});

test('Candidate bulk CV upload requires authentication and returns immediate processing results', async (context) => {
  const app = await createApplication();
  context.after(async () => app.close());

  const unauthenticatedResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/cv-upload')
    .send({ candidates: [{ fileName: 'candidate.pdf', extractedText: 'Candidate CV' }] })
    .expect(401);
  assert.equal(unauthenticatedResponse.body.code, 'UNAUTHORIZED');

  const tokenService = app.get(AuthTokenService);
  const accessToken = await tokenService.createAccessToken({
    id: 'user-1',
    organizationId: 'organization-1',
    role: 'HR',
  });
  const uploadResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/cv-upload')
    .set('Cookie', `access_token=${accessToken}`)
    .send({
      candidates: [
        { fileName: 'candidate.pdf', extractedText: 'Experienced TypeScript engineer.' },
      ],
    })
    .expect(202);
  assert.equal(uploadResponse.body.data.items[0].status, 'CREATED');

  const invalidUploadResponse = await request(app.getHttpServer())
    .post('/api/v1/vacancies/vacancy-1/candidates/cv-upload')
    .set('Cookie', `access_token=${accessToken}`)
    .send({ candidates: [] })
    .expect(400);
  assert.equal(invalidUploadResponse.body.code, 'VALIDATION-ERROR');
});
