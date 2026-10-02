CREATE TABLE "VacancyCustomQuestion" (
    "id" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "evaluationCriteria" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VacancyCustomQuestion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InterviewQuestionAnswer"
ADD COLUMN "vacancyCustomQuestionId" UUID;

CREATE UNIQUE INDEX "VacancyCustomQuestion_vacancyId_displayOrder_key"
ON "VacancyCustomQuestion"("vacancyId", "displayOrder");

CREATE INDEX "VacancyCustomQuestion_vacancyId_idx"
ON "VacancyCustomQuestion"("vacancyId");

CREATE INDEX "VacancyCustomQuestion_vacancyId_displayOrder_idx"
ON "VacancyCustomQuestion"("vacancyId", "displayOrder");

CREATE INDEX "InterviewQuestionAnswer_vacancyCustomQuestionId_idx"
ON "InterviewQuestionAnswer"("vacancyCustomQuestionId");

ALTER TABLE "VacancyCustomQuestion"
ADD CONSTRAINT "VacancyCustomQuestion_vacancyId_fkey"
FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewQuestionAnswer"
ADD CONSTRAINT "InterviewQuestionAnswer_vacancyCustomQuestionId_fkey"
FOREIGN KEY ("vacancyCustomQuestionId") REFERENCES "VacancyCustomQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;