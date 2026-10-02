CREATE TYPE "CandidateProcessingStatus" AS ENUM ('UPLOADED', 'AI_PROCESSING', 'FAILED', 'READY');

ALTER TABLE "Candidate"
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "Candidate"
  ALTER COLUMN "name" SET DEFAULT 'Processing candidate',
  ALTER COLUMN "phone" SET DEFAULT '',
  ADD COLUMN "processingStatus" "CandidateProcessingStatus" NOT NULL DEFAULT 'READY',
  ADD COLUMN "cvFileName" VARCHAR(255),
  ADD COLUMN "cvExtractedText" TEXT,
  ADD COLUMN "cvExtractedData" JSONB,
  ADD COLUMN "cvProcessingError" TEXT;

CREATE INDEX "Candidate_processingStatus_idx" ON "Candidate"("processingStatus");
CREATE UNIQUE INDEX "Candidate_cv_email_unique_non_null"
  ON "Candidate"("email")
  WHERE "email" IS NOT NULL AND "cvFileName" IS NOT NULL;