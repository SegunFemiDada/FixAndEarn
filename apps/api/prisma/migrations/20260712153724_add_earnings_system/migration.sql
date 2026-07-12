-- CreateEnum
CREATE TYPE "FixerEarningStatus" AS ENUM ('AVAILABLE', 'WITHDRAWAL_PENDING', 'PAID');

-- CreateTable
CREATE TABLE "FixerEarning" (
    "id" TEXT NOT NULL,
    "fixerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "grossMilliFec" INTEGER NOT NULL,
    "platformFeeMilliFec" INTEGER NOT NULL,
    "availableMilliFec" INTEGER NOT NULL,
    "status" "FixerEarningStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixerEarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FixerEarning_jobId_key" ON "FixerEarning"("jobId");

-- CreateIndex
CREATE INDEX "FixerEarning_fixerId_idx" ON "FixerEarning"("fixerId");

-- AddForeignKey
ALTER TABLE "FixerEarning" ADD CONSTRAINT "FixerEarning_fixerId_fkey" FOREIGN KEY ("fixerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixerEarning" ADD CONSTRAINT "FixerEarning_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
