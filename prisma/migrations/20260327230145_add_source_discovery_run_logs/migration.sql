-- CreateEnum
CREATE TYPE "SchoolSourceDiscoveryStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "school_source_discovery_runs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "SchoolSourceDiscoveryStatus" NOT NULL DEFAULT 'RUNNING',
    "provider" TEXT NOT NULL DEFAULT 'gemini',
    "queryCount" INTEGER NOT NULL DEFAULT 0,
    "geminiHits" INTEGER NOT NULL DEFAULT 0,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "officialCandidateCount" INTEGER NOT NULL DEFAULT 0,
    "discoveredCount" INTEGER NOT NULL DEFAULT 0,
    "addedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_source_discovery_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "school_source_discovery_runs" ADD CONSTRAINT "school_source_discovery_runs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
