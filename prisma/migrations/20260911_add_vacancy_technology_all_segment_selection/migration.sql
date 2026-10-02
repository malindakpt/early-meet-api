CREATE TYPE "VacancyTechnologySegmentSelection" AS ENUM ('ALL');

ALTER TABLE "VacancyTechnology"
ADD COLUMN "segmentSelection" "VacancyTechnologySegmentSelection";

DROP INDEX "VacancyTechnology_vacancyId_technologySegmentId_key";
DROP INDEX "VacancyTechnology_vacancyId_technologyId_without_segment_key";

CREATE UNIQUE INDEX "VacancyTechnology_vacancyId_technologySegmentId_requirementType_key"
ON "VacancyTechnology"("vacancyId", "technologySegmentId", "requirementType");

CREATE UNIQUE INDEX "VacancyTechnology_vacancyId_technologyId_requirementType_without_segment_key"
ON "VacancyTechnology"("vacancyId", "technologyId", "requirementType")
WHERE "technologySegmentId" IS NULL;