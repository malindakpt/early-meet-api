CREATE TYPE "AssessmentAreaImportance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE "VacancyExperienceArea" (
    "id" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "importance" "AssessmentAreaImportance" NOT NULL,
    "reason" TEXT NOT NULL,
    "whatToEstablish" JSONB NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VacancyExperienceArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VacancyExperienceQuestion" (
    "id" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VacancyExperienceQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VacancyExperienceArea_vacancyId_sequence_key"
ON "VacancyExperienceArea"("vacancyId", "sequence");

CREATE INDEX "VacancyExperienceArea_vacancyId_idx" ON "VacancyExperienceArea"("vacancyId");

CREATE UNIQUE INDEX "VacancyExperienceQuestion_areaId_sequence_key"
ON "VacancyExperienceQuestion"("areaId", "sequence");

CREATE INDEX "VacancyExperienceQuestion_areaId_idx" ON "VacancyExperienceQuestion"("areaId");

ALTER TABLE "VacancyExperienceArea"
ADD CONSTRAINT "VacancyExperienceArea_vacancyId_fkey"
FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VacancyExperienceQuestion"
ADD CONSTRAINT "VacancyExperienceQuestion_areaId_fkey"
FOREIGN KEY ("areaId") REFERENCES "VacancyExperienceArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;