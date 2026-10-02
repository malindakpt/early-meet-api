ALTER TYPE "QuestionStatus" RENAME TO "QuestionStatus_old";

CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'APPROVED', 'ARCHIVED');

ALTER TABLE "Question"
  ALTER COLUMN "status" TYPE "QuestionStatus"
  USING (
    CASE "status"::text
      WHEN 'ACTIVE' THEN 'APPROVED'::"QuestionStatus"
      WHEN 'INACTIVE' THEN 'ARCHIVED'::"QuestionStatus"
    END
  );

DROP TYPE "QuestionStatus_old";

ALTER TABLE "Question" ADD COLUMN "createdByUserId" UUID;

CREATE INDEX "Question_createdByUserId_idx" ON "Question"("createdByUserId");

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "VacancyQuestion_vacancyId_questionId_key"
  ON "VacancyQuestion"("vacancyId", "questionId");