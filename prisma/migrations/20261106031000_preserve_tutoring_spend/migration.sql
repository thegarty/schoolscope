-- DropForeignKey
ALTER TABLE "tutoring_reservations" DROP CONSTRAINT "tutoring_reservations_sessionId_fkey";

-- AlterTable
ALTER TABLE "tutoring_reservations" ALTER COLUMN "sessionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tutoring_reservations" ADD CONSTRAINT "tutoring_reservations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutoring_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

