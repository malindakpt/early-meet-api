-- CV upload no longer runs AI extraction. Until the HR-triggered AI CV match extracts the real
-- name, a candidate is named after its email, or its upload date and time when it has no email.
-- The application always supplies the name, so the old placeholder default is removed.
ALTER TABLE "Candidate"
  ALTER COLUMN "name" DROP DEFAULT;

-- Replace the upload-time placeholder names of candidates whose CV was never extracted.
UPDATE "Candidate"
  SET "name" = COALESCE(
    "email",
    to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS "UTC"')
  )
  WHERE "cvExtractedData" IS NULL AND "name" IN ('Processing candidate...', 'Processing candidate');

-- Uploaded CVs that were waiting for, running, or failed upload-time extraction are complete
-- intakes now: their extraction happens when HR calculates the AI CV match.
UPDATE "Candidate"
  SET "processingStatus" = 'READY', "cvProcessingError" = NULL
  WHERE "processingStatus" IN ('UPLOADED', 'AI_PROCESSING', 'FAILED')
    AND "cvExtractedText" IS NOT NULL;
