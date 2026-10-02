-- Enforce one CV record for each candidate-vacancy association.
CREATE UNIQUE INDEX "CandidateCV_vacancyCandidateId_key" ON "CandidateCV"("vacancyCandidateId");

-- The former non-unique index is redundant after adding the unique index.
DROP INDEX "CandidateCV_vacancyCandidateId_idx";