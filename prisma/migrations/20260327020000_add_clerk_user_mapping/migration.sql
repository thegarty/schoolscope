ALTER TABLE "users"
ADD COLUMN "clerkId" TEXT;

ALTER TABLE "users"
ALTER COLUMN "password" DROP NOT NULL;

CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");
