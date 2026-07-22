-- CreateEnum
CREATE TYPE "Role" AS ENUM ('hr', 'manager', 'employee');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "Parameter" AS ENUM ('OWNERSHIP', 'COMMUNICATION', 'QUALITY_OF_WORK', 'COLLABORATION', 'INITIATIVE');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "reportsToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackCycle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackSubmission" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackScore" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "parameter" "Parameter" NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "FeedbackScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_reportsToId_idx" ON "User"("reportsToId");

-- CreateIndex
CREATE INDEX "FeedbackCycle_companyId_idx" ON "FeedbackCycle"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackCycle_companyId_year_month_key" ON "FeedbackCycle"("companyId", "year", "month");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_cycleId_idx" ON "FeedbackSubmission"("cycleId");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_revieweeId_idx" ON "FeedbackSubmission"("revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackSubmission_cycleId_reviewerId_revieweeId_key" ON "FeedbackSubmission"("cycleId", "reviewerId", "revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackScore_submissionId_parameter_key" ON "FeedbackScore"("submissionId", "parameter");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackCycle" ADD CONSTRAINT "FeedbackCycle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "FeedbackCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackScore" ADD CONSTRAINT "FeedbackScore_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FeedbackSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
