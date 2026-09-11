ALTER TABLE "jobs"
ADD COLUMN "clientArchivedAt" TIMESTAMP(3);

CREATE INDEX "jobs_clientId_clientArchivedAt_idx"
ON "jobs"("clientId", "clientArchivedAt");