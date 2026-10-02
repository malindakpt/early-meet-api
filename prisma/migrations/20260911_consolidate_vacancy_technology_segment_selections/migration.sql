ALTER TABLE "VacancyTechnology"
ADD COLUMN "segmentSelections" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

WITH grouped AS (
  SELECT
    MIN("id"::TEXT)::UUID AS "keepId",
    "vacancyId",
    "technologyId",
    "requirementType",
    BOOL_OR("segmentSelection" = 'ALL') AS "selectsAll",
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT "technologySegmentId"::TEXT), NULL) AS "segmentIds"
  FROM "VacancyTechnology"
  GROUP BY "vacancyId", "technologyId", "requirementType"
)
UPDATE "VacancyTechnology" AS vacancy_technology
SET "segmentSelections" = CASE
  WHEN grouped."selectsAll" THEN ARRAY['ALL']
  ELSE COALESCE(grouped."segmentIds", ARRAY[]::TEXT[])
END
FROM grouped
WHERE vacancy_technology."id" = grouped."keepId";

WITH grouped AS (
  SELECT MIN("id"::TEXT)::UUID AS "keepId"
  FROM "VacancyTechnology"
  GROUP BY "vacancyId", "technologyId", "requirementType"
)
DELETE FROM "VacancyTechnology"
WHERE "id" NOT IN (SELECT "keepId" FROM grouped);

DROP INDEX "VacancyTechnology_vacancyId_technologySegmentId_requirementType_key";
DROP INDEX "VacancyTechnology_vacancyId_technologyId_requirementType_without_segment_key";
ALTER TABLE "VacancyTechnology" DROP CONSTRAINT "VacancyTechnology_technologySegmentId_fkey";
ALTER TABLE "VacancyTechnology" DROP COLUMN "technologySegmentId";
ALTER TABLE "VacancyTechnology" DROP COLUMN "segmentSelection";
DROP TYPE "VacancyTechnologySegmentSelection";

CREATE UNIQUE INDEX "VacancyTechnology_vacancyId_technologyId_requirementType_key"
ON "VacancyTechnology"("vacancyId", "technologyId", "requirementType");