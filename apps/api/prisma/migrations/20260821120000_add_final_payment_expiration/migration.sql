-- Add FINAL payment expiration support.

ALTER TYPE "JobPaymentStatus"
ADD VALUE 'EXPIRED';

ALTER TABLE "JobPayment"
ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "JobPayment_status_expiresAt_idx"
ON "JobPayment"("status", "expiresAt");