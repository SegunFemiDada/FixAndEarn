-- Drop old table if it exists
DROP TABLE IF EXISTS "FixerEarning" CASCADE;

-- Drop old enum if it exists
DROP TYPE IF EXISTS "FixerEarningStatus";

-- Create new enum
CREATE TYPE "FixerEarningStatus" AS ENUM (
  'AVAILABLE',
  'PROCESSING',
  'PAID',
  'CANCELLED'
);

-- Create new fixer earnings table
CREATE TABLE "fixer_earnings" (
    "id" TEXT NOT NULL,
    "fixerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "grossMilliFec" INTEGER NOT NULL,
    "platformFeeMilliFec" INTEGER NOT NULL,
    "availableMilliFec" INTEGER NOT NULL,
    "status" "FixerEarningStatus" NOT NULL DEFAULT 'AVAILABLE',
    "withdrawalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "fixer_earnings_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fixer_earnings_jobId_key"
ON "fixer_earnings"("jobId");

CREATE INDEX "fixer_earnings_fixerId_idx"
ON "fixer_earnings"("fixerId");

CREATE INDEX "fixer_earnings_status_idx"
ON "fixer_earnings"("status");

CREATE INDEX "fixer_earnings_withdrawalId_idx"
ON "fixer_earnings"("withdrawalId");

ALTER TABLE "fixer_earnings"
ADD CONSTRAINT "fixer_earnings_fixerId_fkey"
FOREIGN KEY ("fixerId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "fixer_earnings"
ADD CONSTRAINT "fixer_earnings_jobId_fkey"
FOREIGN KEY ("jobId")
REFERENCES "jobs"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "fixer_earnings"
ADD CONSTRAINT "fixer_earnings_withdrawalId_fkey"
FOREIGN KEY ("withdrawalId")
REFERENCES "withdrawal_requests"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;