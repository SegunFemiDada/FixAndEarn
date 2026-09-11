CREATE TYPE "JobModerationStatus" AS ENUM ('CLEAR', 'FLAGGED');

ALTER TABLE "jobs"
ADD COLUMN "moderationStatus" "JobModerationStatus" NOT NULL DEFAULT 'CLEAR',
ADD COLUMN "flaggedAt" TIMESTAMP(3),
ADD COLUMN "flaggedByAdminId" TEXT,
ADD COLUMN "flagReason" TEXT;

CREATE INDEX "jobs_moderationStatus_idx"
ON "jobs"("moderationStatus");