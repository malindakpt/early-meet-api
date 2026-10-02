CREATE TYPE "ExperienceCompetencyGenerationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TYPE "ExperienceCompetencyGenerationStage" AS ENUM ('PREPARING', 'ANALYZING_JOB', 'IDENTIFYING_FOCUS_AREAS', 'GENERATING_PLAN', 'VALIDATING_RESULT', 'SAVING_RESULT', 'COMPLETED');

CREATE TABLE "ExperienceCompetencyGeneration" (
    "id" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "status" "ExperienceCompetencyGenerationStatus" NOT NULL,
    "stage" "ExperienceCompetencyGenerationStage" NOT NULL,
    "progress" INTEGER NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "result" JSONB,
    "error" VARCHAR(255),
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ExperienceCompetencyGeneration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExperienceCompetencyGeneration_vacancyId_createdAt_idx"
ON "ExperienceCompetencyGeneration"("vacancyId", "createdAt");

CREATE INDEX "ExperienceCompetencyGeneration_vacancyId_status_idx"
ON "ExperienceCompetencyGeneration"("vacancyId", "status");

CREATE UNIQUE INDEX "ExperienceCompetencyGeneration_one_active_per_vacancy"
ON "ExperienceCompetencyGeneration"("vacancyId")
WHERE "status" IN ('QUEUED', 'PROCESSING');

ALTER TABLE "ExperienceCompetencyGeneration"
ADD CONSTRAINT "ExperienceCompetencyGeneration_vacancyId_fkey"
FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;