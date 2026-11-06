-- CreateTable
CREATE TABLE "tutoring_sessions" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "childId" TEXT,
    "visitorHash" TEXT,
    "ipHash" TEXT,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "context" JSONB NOT NULL,
    "workspace" JSONB NOT NULL DEFAULT '[]',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "backendCalls" INTEGER NOT NULL DEFAULT 0,
    "escalations" INTEGER NOT NULL DEFAULT 0,
    "backendCostMicros" INTEGER NOT NULL DEFAULT 0,
    "voiceSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liveId" TEXT,
    "finalUsageKnown" BOOLEAN NOT NULL DEFAULT false,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "retainedUntil" TIMESTAMP(3) NOT NULL,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "tutoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "operationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_attachments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutoring_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_reservations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "reservedMicros" INTEGER NOT NULL DEFAULT 1000000,
    "settledMicros" INTEGER,

    CONSTRAINT "tutoring_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_controls" (
    "id" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutoring_controls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutoring_sessions_parentId_createdAt_idx" ON "tutoring_sessions"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "tutoring_sessions_visitorHash_createdAt_idx" ON "tutoring_sessions"("visitorHash", "createdAt");

-- CreateIndex
CREATE INDEX "tutoring_sessions_status_expiresAt_idx" ON "tutoring_sessions"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "tutoring_events_sessionId_seq_key" ON "tutoring_events"("sessionId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "tutoring_events_sessionId_operationId_key" ON "tutoring_events"("sessionId", "operationId");

-- CreateIndex
CREATE UNIQUE INDEX "tutoring_attachments_key_key" ON "tutoring_attachments"("key");

-- CreateIndex
CREATE UNIQUE INDEX "tutoring_reservations_sessionId_key" ON "tutoring_reservations"("sessionId");

-- CreateIndex
CREATE INDEX "tutoring_reservations_day_idx" ON "tutoring_reservations"("day");

-- AddForeignKey
ALTER TABLE "tutoring_events" ADD CONSTRAINT "tutoring_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_attachments" ADD CONSTRAINT "tutoring_attachments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_reservations" ADD CONSTRAINT "tutoring_reservations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutoring_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

