-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "completedApprovedAt" TIMESTAMP(3),
ADD COLUMN     "completedRequestedAt" TIMESTAMP(3),
ADD COLUMN     "fixerId" TEXT;

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fixerId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_jobId_key" ON "ratings"("jobId");

-- CreateIndex
CREATE INDEX "ratings_fixerId_createdAt_idx" ON "ratings"("fixerId", "createdAt");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_fixerId_fkey" FOREIGN KEY ("fixerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
