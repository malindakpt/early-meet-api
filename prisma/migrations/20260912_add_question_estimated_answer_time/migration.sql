ALTER TABLE "Question"
ADD COLUMN "estimatedAnswerTimeSeconds" INTEGER NOT NULL DEFAULT 120;

ALTER TABLE "Vacancy"
DROP COLUMN "duration";