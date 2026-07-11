/*
  Warnings:

  - A unique constraint covering the columns `[jobId,type]` on the table `JobPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "JobPayment_jobId_key";

-- CreateIndex
CREATE UNIQUE INDEX "JobPayment_jobId_type_key" ON "JobPayment"("jobId", "type");
