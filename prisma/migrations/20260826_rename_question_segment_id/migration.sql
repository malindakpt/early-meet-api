-- Rename the Question foreign-key column while preserving existing values.
ALTER TABLE "Question" RENAME COLUMN "segmentId" TO "technologySegmentId";

-- Rename dependent database objects for consistency with the column name.
ALTER INDEX "Question_segmentId_idx" RENAME TO "Question_technologySegmentId_idx";
ALTER TABLE "Question" RENAME CONSTRAINT "Question_segmentId_fkey" TO "Question_technologySegmentId_fkey";