-- Preserve application users and all related records. Provider subjects are not interchangeable.
ALTER TABLE "users" ADD COLUMN "allauthId" TEXT;
CREATE UNIQUE INDEX "users_allauthId_key" ON "users"("allauthId");
ALTER TABLE "users" DROP COLUMN "clerkId";
