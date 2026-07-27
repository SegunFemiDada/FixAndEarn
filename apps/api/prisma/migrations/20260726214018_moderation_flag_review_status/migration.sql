-- CreateEnum
CREATE TYPE "ModerationFlagStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- AlterTable
ALTER TABLE "moderation_flags" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByAdminId" TEXT,
ADD COLUMN     "status" "ModerationFlagStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "moderation_flags_status_idx" ON "moderation_flags"("status");

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
