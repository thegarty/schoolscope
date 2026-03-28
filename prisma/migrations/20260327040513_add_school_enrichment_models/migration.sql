-- CreateEnum
CREATE TYPE "SchoolSourceType" AS ENUM ('SCHOOL_WEBSITE', 'EDUCATION_DEPARTMENT', 'GOVERNMENT_DIRECTORY', 'OTHER_OFFICIAL');

-- CreateEnum
CREATE TYPE "SchoolEnrichmentRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SchoolEnrichmentTriggerType" AS ENUM ('MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "SchoolEnrichmentProposalType" AS ENUM ('FIELD', 'ABOUT', 'EVENT');

-- CreateEnum
CREATE TYPE "SchoolEnrichmentProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "SchoolAboutVersionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceConfidence" DOUBLE PRECISION,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "aboutContent" TEXT,
ADD COLUMN     "aboutSummary" TEXT,
ADD COLUMN     "aboutUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "enrichmentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enrichmentFrequencyHours" INTEGER NOT NULL DEFAULT 168,
ADD COLUMN     "enrichmentPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enrichmentPilot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEnrichmentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "school_sources" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" "SchoolSourceType" NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_enrichment_runs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "SchoolEnrichmentRunStatus" NOT NULL DEFAULT 'PENDING',
    "triggerType" "SchoolEnrichmentTriggerType" NOT NULL DEFAULT 'MANUAL',
    "totalSources" INTEGER NOT NULL DEFAULT 0,
    "processedSources" INTEGER NOT NULL DEFAULT 0,
    "proposalsCreated" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_enrichment_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_enrichment_proposals" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT,
    "sourceId" TEXT,
    "proposalType" "SchoolEnrichmentProposalType" NOT NULL,
    "targetField" TEXT,
    "existingValue" TEXT,
    "proposedValue" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sourceUrl" TEXT NOT NULL,
    "evidenceSnippet" TEXT,
    "status" "SchoolEnrichmentProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_enrichment_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_about_versions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "proposalId" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT,
    "status" "SchoolAboutVersionStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_about_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RunSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RunSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_sources_schoolId_url_key" ON "school_sources"("schoolId", "url");

-- CreateIndex
CREATE INDEX "_RunSource_B_index" ON "_RunSource"("B");

-- AddForeignKey
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_enrichment_runs" ADD CONSTRAINT "school_enrichment_runs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_enrichment_proposals" ADD CONSTRAINT "school_enrichment_proposals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_enrichment_proposals" ADD CONSTRAINT "school_enrichment_proposals_runId_fkey" FOREIGN KEY ("runId") REFERENCES "school_enrichment_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_enrichment_proposals" ADD CONSTRAINT "school_enrichment_proposals_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "school_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_enrichment_proposals" ADD CONSTRAINT "school_enrichment_proposals_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_about_versions" ADD CONSTRAINT "school_about_versions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_about_versions" ADD CONSTRAINT "school_about_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "school_enrichment_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RunSource" ADD CONSTRAINT "_RunSource_A_fkey" FOREIGN KEY ("A") REFERENCES "school_enrichment_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RunSource" ADD CONSTRAINT "_RunSource_B_fkey" FOREIGN KEY ("B") REFERENCES "school_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
