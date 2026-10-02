-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'HR');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TechnologyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TechnologySegmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('REQUIRED', 'PREFERRED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CandidateDecision" AS ENUM ('KEEP_IN_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED');

-- CreateEnum
CREATE TYPE "CVProcessingStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InterviewQuestionStatus" AS ENUM ('PENDING', 'ASKED', 'ANSWERED');

-- CreateEnum
CREATE TYPE "InterviewRecommendation" AS ENUM ('STRONGLY_RECOMMENDED', 'RECOMMENDED', 'CONSIDER', 'NOT_RECOMMENDED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "emailDomain" VARCHAR(255) NOT NULL,
    "status" "OrganizationStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "status" "UserStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacancy" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "workType" "WorkType" NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "experienceMin" INTEGER NOT NULL,
    "experienceMax" INTEGER NOT NULL,
    "deadline" TIMESTAMPTZ NOT NULL,
    "duration" INTEGER NOT NULL,
    "interviewType" "InterviewType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "status" "VacancyStatus" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TechnologyStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologySegment" (
    "id" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TechnologySegmentStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TechnologySegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyTechnology" (
    "id" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "requirementType" "RequirementType" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VacancyTechnology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "questionType" VARCHAR(50) NOT NULL,
    "followUpAllowed" BOOLEAN NOT NULL,
    "status" "QuestionStatus" NOT NULL,
    "questionText" TEXT NOT NULL,
    "evaluationCriteria" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyQuestion" (
    "id" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "questionType" VARCHAR(50) NOT NULL,
    "followUpAllowed" BOOLEAN NOT NULL,
    "evaluationCriteria" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VacancyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "status" "CandidateStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyCandidate" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "vacancyMatchScore" DECIMAL(5,2) NOT NULL,
    "requiredTechnologiesMet" TEXT[],
    "preferredTechnologiesMet" TEXT[],
    "strengths" TEXT[],
    "gaps" TEXT[],
    "decision" "CandidateDecision" NOT NULL,
    "summary" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VacancyCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateCV" (
    "id" UUID NOT NULL,
    "vacancyCandidateId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileURL" TEXT NOT NULL,
    "fileType" VARCHAR(100) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "processingStatus" "CVProcessingStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CandidateCV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewInvitation" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "sentAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "status" "InvitationStatus" NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InterviewInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "vacancyId" UUID NOT NULL,
    "status" "InterviewSessionStatus" NOT NULL,
    "overallScore" DECIMAL(5,2),
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "summary" TEXT,
    "recommendation" "InterviewRecommendation",
    "evaluatedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestionAnswer" (
    "id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "interviewSessionId" UUID NOT NULL,
    "vacancyQuestionId" UUID,
    "followUpFromId" UUID,
    "status" "InterviewQuestionStatus" NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT,
    "askedAt" TIMESTAMPTZ,
    "answeredAt" TIMESTAMPTZ,
    "score" DECIMAL(5,2),
    "explanation" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InterviewQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_emailDomain_key" ON "Organization"("emailDomain");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Vacancy_organizationId_idx" ON "Vacancy"("organizationId");

-- CreateIndex
CREATE INDEX "Vacancy_createdBy_idx" ON "Vacancy"("createdBy");

-- CreateIndex
CREATE INDEX "Vacancy_departmentId_idx" ON "Vacancy"("departmentId");

-- CreateIndex
CREATE INDEX "Vacancy_status_idx" ON "Vacancy"("status");

-- CreateIndex
CREATE INDEX "Vacancy_deadline_idx" ON "Vacancy"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_key" ON "Technology"("name");

-- CreateIndex
CREATE INDEX "TechnologySegment_technologyId_idx" ON "TechnologySegment"("technologyId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnologySegment_technologyId_name_key" ON "TechnologySegment"("technologyId", "name");

-- CreateIndex
CREATE INDEX "VacancyTechnology_vacancyId_idx" ON "VacancyTechnology"("vacancyId");

-- CreateIndex
CREATE INDEX "VacancyTechnology_technologyId_idx" ON "VacancyTechnology"("technologyId");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyTechnology_vacancyId_technologyId_key" ON "VacancyTechnology"("vacancyId", "technologyId");

-- CreateIndex
CREATE INDEX "Question_technologyId_idx" ON "Question"("technologyId");

-- CreateIndex
CREATE INDEX "Question_segmentId_idx" ON "Question"("segmentId");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "VacancyQuestion_vacancyId_idx" ON "VacancyQuestion"("vacancyId");

-- CreateIndex
CREATE INDEX "VacancyQuestion_sequence_idx" ON "VacancyQuestion"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyQuestion_vacancyId_sequence_key" ON "VacancyQuestion"("vacancyId", "sequence");

-- CreateIndex
CREATE INDEX "Candidate_email_idx" ON "Candidate"("email");

-- CreateIndex
CREATE INDEX "VacancyCandidate_vacancyId_idx" ON "VacancyCandidate"("vacancyId");

-- CreateIndex
CREATE INDEX "VacancyCandidate_candidateId_idx" ON "VacancyCandidate"("candidateId");

-- CreateIndex
CREATE INDEX "VacancyCandidate_vacancyMatchScore_idx" ON "VacancyCandidate"("vacancyMatchScore");

-- CreateIndex
CREATE INDEX "VacancyCandidate_decision_idx" ON "VacancyCandidate"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyCandidate_candidateId_vacancyId_key" ON "VacancyCandidate"("candidateId", "vacancyId");

-- CreateIndex
CREATE INDEX "CandidateCV_vacancyCandidateId_idx" ON "CandidateCV"("vacancyCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewInvitation_tokenHash_key" ON "InterviewInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "InterviewInvitation_candidateId_idx" ON "InterviewInvitation"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewInvitation_vacancyId_idx" ON "InterviewInvitation"("vacancyId");

-- CreateIndex
CREATE INDEX "InterviewInvitation_tokenHash_idx" ON "InterviewInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "InterviewInvitation_status_idx" ON "InterviewInvitation"("status");

-- CreateIndex
CREATE INDEX "InterviewInvitation_expiresAt_idx" ON "InterviewInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_invitationId_key" ON "InterviewSession"("invitationId");

-- CreateIndex
CREATE INDEX "InterviewSession_invitationId_idx" ON "InterviewSession"("invitationId");

-- CreateIndex
CREATE INDEX "InterviewSession_candidateId_idx" ON "InterviewSession"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewSession_vacancyId_idx" ON "InterviewSession"("vacancyId");

-- CreateIndex
CREATE INDEX "InterviewSession_status_idx" ON "InterviewSession"("status");

-- CreateIndex
CREATE INDEX "InterviewQuestionAnswer_interviewSessionId_idx" ON "InterviewQuestionAnswer"("interviewSessionId");

-- CreateIndex
CREATE INDEX "InterviewQuestionAnswer_vacancyQuestionId_idx" ON "InterviewQuestionAnswer"("vacancyQuestionId");

-- CreateIndex
CREATE INDEX "InterviewQuestionAnswer_followUpFromId_idx" ON "InterviewQuestionAnswer"("followUpFromId");

-- CreateIndex
CREATE INDEX "InterviewQuestionAnswer_sequence_idx" ON "InterviewQuestionAnswer"("sequence");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologySegment" ADD CONSTRAINT "TechnologySegment_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyTechnology" ADD CONSTRAINT "VacancyTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyTechnology" ADD CONSTRAINT "VacancyTechnology_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "TechnologySegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyQuestion" ADD CONSTRAINT "VacancyQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyQuestion" ADD CONSTRAINT "VacancyQuestion_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyCandidate" ADD CONSTRAINT "VacancyCandidate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyCandidate" ADD CONSTRAINT "VacancyCandidate_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCV" ADD CONSTRAINT "CandidateCV_vacancyCandidateId_fkey" FOREIGN KEY ("vacancyCandidateId") REFERENCES "VacancyCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInvitation" ADD CONSTRAINT "InterviewInvitation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInvitation" ADD CONSTRAINT "InterviewInvitation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInvitation" ADD CONSTRAINT "InterviewInvitation_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "InterviewInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestionAnswer" ADD CONSTRAINT "InterviewQuestionAnswer_followUpFromId_fkey" FOREIGN KEY ("followUpFromId") REFERENCES "InterviewQuestionAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestionAnswer" ADD CONSTRAINT "InterviewQuestionAnswer_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "InterviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestionAnswer" ADD CONSTRAINT "InterviewQuestionAnswer_vacancyQuestionId_fkey" FOREIGN KEY ("vacancyQuestionId") REFERENCES "VacancyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

