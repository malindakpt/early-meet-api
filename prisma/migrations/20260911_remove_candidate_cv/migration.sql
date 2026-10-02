DROP INDEX IF EXISTS "Candidate_cv_email_unique_non_null";

WITH latest_legacy_cv AS (
  SELECT DISTINCT ON (vacancy_candidate."candidateId")
    vacancy_candidate."candidateId",
    cv."fileName",
    cv."extractedText",
    cv."extractedData",
    cv."processingStatus"
  FROM "VacancyCandidate" AS vacancy_candidate
  INNER JOIN "CandidateCV" AS cv ON cv."vacancyCandidateId" = vacancy_candidate.id
  ORDER BY vacancy_candidate."candidateId", cv."updatedAt" DESC, cv.id DESC
)
UPDATE "Candidate" AS candidate
SET
  "cvFileName" = latest_legacy_cv."fileName",
  "cvExtractedText" = latest_legacy_cv."extractedText",
  "cvExtractedData" = latest_legacy_cv."extractedData",
  "cvProcessingError" = CASE
    WHEN latest_legacy_cv."processingStatus" = 'FAILED' THEN 'Legacy CV processing failed.'
    ELSE NULL
  END,
  "processingStatus" = CASE latest_legacy_cv."processingStatus"
    WHEN 'PROCESSED' THEN 'READY'::"CandidateProcessingStatus"
    WHEN 'FAILED' THEN 'FAILED'::"CandidateProcessingStatus"
    WHEN 'PROCESSING' THEN 'AI_PROCESSING'::"CandidateProcessingStatus"
    ELSE 'UPLOADED'::"CandidateProcessingStatus"
  END
FROM latest_legacy_cv
WHERE latest_legacy_cv."candidateId" = candidate.id;

DROP TABLE "CandidateCV";
DROP TYPE "CVProcessingStatus";