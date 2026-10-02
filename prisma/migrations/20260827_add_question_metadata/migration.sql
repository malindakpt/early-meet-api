-- Add metadata without invalidating existing Question rows.
ALTER TABLE "Question" ADD COLUMN "metaData" JSONB;

UPDATE "Question" SET "metaData" = '{}'::JSONB WHERE "metaData" IS NULL;

ALTER TABLE "Question" ALTER COLUMN "metaData" SET NOT NULL;