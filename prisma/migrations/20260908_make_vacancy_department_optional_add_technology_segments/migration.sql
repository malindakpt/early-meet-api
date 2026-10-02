ALTER TABLE "Vacancy" ALTER COLUMN "departmentId" DROP NOT NULL;

ALTER TABLE "VacancyTechnology" ADD COLUMN "technologySegmentId" UUID;

DROP INDEX "VacancyTechnology_vacancyId_technologyId_key";

CREATE UNIQUE INDEX "VacancyTechnology_vacancyId_technologySegmentId_key"
ON "VacancyTechnology"("vacancyId", "technologySegmentId");

CREATE INDEX "VacancyTechnology_technologySegmentId_idx"
ON "VacancyTechnology"("technologySegmentId");

ALTER TABLE "VacancyTechnology"
ADD CONSTRAINT "VacancyTechnology_technologySegmentId_fkey"
FOREIGN KEY ("technologySegmentId") REFERENCES "TechnologySegment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;