CREATE TYPE "InterviewEvaluationStatus" AS ENUM ('NOT_STARTED', 'EVALUATING', 'EVALUATED', 'FAILED');

ALTER TABLE "InterviewSession"
    ADD COLUMN "evaluationStatus" "InterviewEvaluationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN "evaluationStartedAt" TIMESTAMPTZ,
    ADD COLUMN "candidateIntelligence" JSONB;

CREATE INDEX "InterviewSession_evaluationStatus_idx" ON "InterviewSession"("evaluationStatus");