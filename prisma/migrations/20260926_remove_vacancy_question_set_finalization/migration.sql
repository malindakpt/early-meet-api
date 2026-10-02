-- Question-set finalization was removed: vacancy question sets stay editable and interviews no
-- longer require a finalized set.
ALTER TABLE "Vacancy" DROP COLUMN "questionSetFinalizedAt";
