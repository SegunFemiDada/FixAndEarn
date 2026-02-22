-- CreateEnum
CREATE TYPE "CompletionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "job_completion_requests" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fixerId" TEXT NOT NULL,
    "status" "CompletionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByClientId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,

    CONSTRAINT "job_completion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_reviews" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fixerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_completion_requests_jobId_key" ON "job_completion_requests"("jobId");

-- CreateIndex
CREATE INDEX "job_completion_requests_fixerId_status_idx" ON "job_completion_requests"("fixerId", "status");

-- CreateIndex
CREATE INDEX "job_completion_requests_jobId_idx" ON "job_completion_requests"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_reviews_jobId_key" ON "job_reviews"("jobId");

-- CreateIndex
CREATE INDEX "job_reviews_fixerId_createdAt_idx" ON "job_reviews"("fixerId", "createdAt");

-- CreateIndex
CREATE INDEX "job_reviews_clientId_createdAt_idx" ON "job_reviews"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "job_completion_requests" ADD CONSTRAINT "job_completion_requests_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_completion_requests" ADD CONSTRAINT "job_completion_requests_fixerId_fkey" FOREIGN KEY ("fixerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_reviews" ADD CONSTRAINT "job_reviews_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_reviews" ADD CONSTRAINT "job_reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_reviews" ADD CONSTRAINT "job_reviews_fixerId_fkey" FOREIGN KEY ("fixerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
