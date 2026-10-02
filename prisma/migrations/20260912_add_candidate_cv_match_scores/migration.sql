CREATE TYPE "AiMatchStatus" AS ENUM ('NOT_REQUESTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "VacancyCandidate"
  ADD COLUMN "keywordMatchScore" DECIMAL(5,2),
  ADD COLUMN "keywordMatchCalculatedAt" TIMESTAMPTZ,
  ADD COLUMN "keywordMatchBreakdown" JSONB,
  ADD COLUMN "aiMatchScore" DECIMAL(5,2),
  ADD COLUMN "aiMatchStatus" "AiMatchStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN "aiMatchStartedAt" TIMESTAMPTZ,
  ADD COLUMN "aiMatchCompletedAt" TIMESTAMPTZ,
  ADD COLUMN "aiMatchError" TEXT;

CREATE INDEX "VacancyCandidate_keywordMatchScore_idx" ON "VacancyCandidate"("keywordMatchScore");
CREATE INDEX "VacancyCandidate_aiMatchScore_idx" ON "VacancyCandidate"("aiMatchScore");
CREATE INDEX "VacancyCandidate_aiMatchStatus_idx" ON "VacancyCandidate"("aiMatchStatus");