-- Drop old table
DROP TABLE IF EXISTS "job_payments" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "JobPaymentType";
DROP TYPE IF EXISTS "JobPaymentStatus";

-- Create new enum
CREATE TYPE "JobPaymentStatus" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);

-- Create new table
CREATE TABLE "JobPayment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amountMilliFec" INTEGER NOT NULL,
    "paystackFeeMilliFec" INTEGER NOT NULL,
    "status" "JobPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobPayment_jobId_key"
ON "JobPayment"("jobId");

CREATE UNIQUE INDEX "JobPayment_reference_key"
ON "JobPayment"("reference");

ALTER TABLE "JobPayment"
ADD CONSTRAINT "JobPayment_jobId_fkey"
FOREIGN KEY ("jobId")
REFERENCES "jobs"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;