export interface IEnvironmentVariables {
  AUTH_SECRET: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  EMAIL_FROM: string;
  INTERVIEW_APP_URL: string;
  MATCH_PREFERRED_TECHNOLOGY_WEIGHT: number;
  MATCH_REQUIRED_TECHNOLOGY_WEIGHT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  OPENAI_API_KEY: string;
  OPENAI_CANDIDATE_EVALUATION_MODEL: string;
  OPENAI_CV_EXTRACTION_MODEL: string;
  OPENAI_TIMEOUT_MS: number;
  PORT: number;
  SMTP_HOST: string;
  SMTP_PASSWORD: string;
  SMTP_PORT: number;
  SMTP_USERNAME: string;
  WEB_APP_URL: string;
}

export function validateEnvironment(config: Record<string, unknown>): IEnvironmentVariables {
  const nodeEnvironment = valueAsString(config.NODE_ENV) ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnvironment)) {
    throw new Error('NODE_ENV must be development, production, or test.');
  }

  const databaseUrl = requiredValue(config.DATABASE_URL, 'DATABASE_URL');
  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use the postgres or postgresql protocol.');
  }

  const port = parsePort(valueAsString(config.PORT) ?? '3001');
  const corsOrigin = valueAsString(config.CORS_ORIGIN) ?? 'http://localhost:3000';
  const webAppUrl = parseHttpUrl(requiredValue(config.WEB_APP_URL, 'WEB_APP_URL'), 'WEB_APP_URL');
  // Origin of the standalone candidate Interview App used in invitation links. Defaults to the
  // web origin for deployments that route /interview/* to the Interview App on the same host.
  const configuredInterviewAppUrl = valueAsString(config.INTERVIEW_APP_URL) ?? '';
  const interviewAppUrl = parseHttpUrl(
    configuredInterviewAppUrl.length > 0 ? configuredInterviewAppUrl : webAppUrl,
    'INTERVIEW_APP_URL',
  );
  const emailFrom = requiredValue(config.EMAIL_FROM, 'EMAIL_FROM');
  const smtpHost = requiredValue(config.SMTP_HOST, 'SMTP_HOST');
  const smtpPort = parsePort(requiredValue(config.SMTP_PORT, 'SMTP_PORT'));
  const smtpUsername = requiredValue(config.SMTP_USERNAME, 'SMTP_USERNAME');
  const smtpPassword = requiredValue(config.SMTP_PASSWORD, 'SMTP_PASSWORD');
  const openAiApiKey = requiredValue(config.OPENAI_API_KEY, 'OPENAI_API_KEY');
  const openAiCvExtractionModel = requiredValue(
    config.OPENAI_CV_EXTRACTION_MODEL,
    'OPENAI_CV_EXTRACTION_MODEL',
  );
  const openAiCandidateEvaluationModel = requiredValue(
    config.OPENAI_CANDIDATE_EVALUATION_MODEL,
    'OPENAI_CANDIDATE_EVALUATION_MODEL',
  );
  const openAiTimeoutMs = parseOpenAiTimeout(valueAsString(config.OPENAI_TIMEOUT_MS) ?? '30000');
  const matchRequiredTechnologyWeight = parseMatchWeight(
    valueAsString(config.MATCH_REQUIRED_TECHNOLOGY_WEIGHT) ?? '70',
    'MATCH_REQUIRED_TECHNOLOGY_WEIGHT',
  );
  const matchPreferredTechnologyWeight = parseMatchWeight(
    valueAsString(config.MATCH_PREFERRED_TECHNOLOGY_WEIGHT) ?? '30',
    'MATCH_PREFERRED_TECHNOLOGY_WEIGHT',
  );
  if (matchRequiredTechnologyWeight + matchPreferredTechnologyWeight !== 100) {
    throw new Error(
      'MATCH_REQUIRED_TECHNOLOGY_WEIGHT and MATCH_PREFERRED_TECHNOLOGY_WEIGHT must total 100.',
    );
  }
  const authSecret = requiredValue(config.AUTH_SECRET, 'AUTH_SECRET');
  if (authSecret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long.');
  }

  return {
    AUTH_SECRET: authSecret,
    NODE_ENV: nodeEnvironment as IEnvironmentVariables['NODE_ENV'],
    DATABASE_URL: databaseUrl,
    PORT: port,
    CORS_ORIGIN: corsOrigin,
    WEB_APP_URL: webAppUrl,
    EMAIL_FROM: emailFrom,
    INTERVIEW_APP_URL: interviewAppUrl,
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_USERNAME: smtpUsername,
    SMTP_PASSWORD: smtpPassword,
    OPENAI_API_KEY: openAiApiKey,
    OPENAI_CANDIDATE_EVALUATION_MODEL: openAiCandidateEvaluationModel,
    OPENAI_CV_EXTRACTION_MODEL: openAiCvExtractionModel,
    OPENAI_TIMEOUT_MS: openAiTimeoutMs,
    MATCH_REQUIRED_TECHNOLOGY_WEIGHT: matchRequiredTechnologyWeight,
    MATCH_PREFERRED_TECHNOLOGY_WEIGHT: matchPreferredTechnologyWeight,
  };
}

function parseHttpUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP URL.`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use the http or https protocol.`);
  }
  return url.toString();
}

function requiredValue(value: unknown, name: string): string {
  const stringValue = valueAsString(value);
  if (stringValue === undefined || stringValue.length === 0) {
    throw new Error(`${name} is required.`);
  }

  return stringValue;
}

function valueAsString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function parseOpenAiTimeout(value: string): number {
  const milliseconds = Number(value);
  if (!Number.isInteger(milliseconds) || milliseconds < 1_000 || milliseconds > 120_000) {
    throw new Error('OPENAI_TIMEOUT_MS must be an integer between 1000 and 120000.');
  }
  return milliseconds;
}

function parseMatchWeight(value: string, name: string): number {
  const weight = Number(value);
  if (!Number.isInteger(weight) || weight < 0 || weight > 100) {
    throw new Error(`${name} must be an integer between 0 and 100.`);
  }
  return weight;
}
