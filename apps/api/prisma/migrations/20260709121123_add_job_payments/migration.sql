-- CreateEnum
CREATE TYPE "JobPaymentType" AS ENUM ('POSTING_FEE', 'URGENT_HIRE_FEE', 'FINAL_PAYMENT');

-- CreateEnum
CREATE TYPE "JobPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "job_payments" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "JobPaymentType" NOT NULL,
    "amountMilliFec" INTEGER NOT NULL,
    "paystackReference" TEXT NOT NULL,
    "status" "JobPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paystackAccessCode" TEXT,
    "authorizationUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_payments_paystackReference_key" ON "job_payments"("paystackReference");

-- CreateIndex
CREATE INDEX "job_payments_jobId_idx" ON "job_payments"("jobId");

-- CreateIndex
CREATE INDEX "job_payments_status_idx" ON "job_payments"("status");

-- CreateIndex
CREATE INDEX "job_payments_type_idx" ON "job_payments"("type");

-- AddForeignKey
ALTER TABLE "job_payments" ADD CONSTRAINT "job_payments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
