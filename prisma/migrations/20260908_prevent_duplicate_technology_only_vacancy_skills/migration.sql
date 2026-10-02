CREATE UNIQUE INDEX "VacancyTechnology_vacancyId_technologyId_without_segment_key"
ON "VacancyTechnology"("vacancyId", "technologyId")
WHERE "technologySegmentId" IS NULL;