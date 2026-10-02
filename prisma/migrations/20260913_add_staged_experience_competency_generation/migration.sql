ALTER TYPE "ExperienceCompetencyGenerationStage" ADD VALUE IF NOT EXISTS 'GENERATING_QUESTIONS';
ALTER TYPE "ExperienceCompetencyGenerationStage" ADD VALUE IF NOT EXISTS 'VALIDATING_QUESTIONS';
ALTER TYPE "ExperienceCompetencyGenerationStage" ADD VALUE IF NOT EXISTS 'FINALIZING_PLAN';

ALTER TABLE "ExperienceCompetencyGeneration" ADD COLUMN "areaProgress" JSONB;