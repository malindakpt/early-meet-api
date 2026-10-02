CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The volatile default is evaluated per row, so existing vacancies each receive their own token.
ALTER TABLE "Vacancy"
ADD COLUMN "publicApplicationToken" VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex');

CREATE UNIQUE INDEX "Vacancy_publicApplicationToken_key"
ON "Vacancy"("publicApplicationToken");
