-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('SEND', 'DELIVERY', 'BOUNCE', 'COMPLAINT', 'REJECT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailSubscribed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "eventType" "EmailEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "bounceType" TEXT,
    "subType" TEXT,
    "destination" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_events_messageId_key" ON "email_events"("messageId");

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
