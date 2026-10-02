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
export declare function validateEnvironment(config: Record<string, unknown>): IEnvironmentVariables;
