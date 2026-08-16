/*
  Paystack naming cleanup.

  This migration renames existing database columns instead of dropping
  and recreating them, so existing payment/withdrawal data is preserved.
*/

-- ============================================================
-- 1. Remove obsolete notification enum values
-- ============================================================

BEGIN;

CREATE TYPE "NotificationType_new" AS ENUM (
  'JOB_COMPLETION_REQUESTED',
  'JOB_COMPLETION_APPROVED',
  'JOB_COMPLETION_REJECTED',
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  'JOB_APPLIED',
  'DEPOSIT_SUCCEEDED',
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
  'WITHDRAWAL_PAID',
  'SYSTEM_ANNOUNCEMENT'
);

ALTER TABLE "notifications"
ALTER COLUMN "type"
TYPE "NotificationType_new"
USING ("type"::text::"NotificationType_new");

ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";

ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";

DROP TYPE "NotificationType_old";

COMMIT;


-- ============================================================
-- 2. JobPayment
--    Rename old Paystack fields instead of deleting them
-- ============================================================

ALTER TABLE "JobPayment"
RENAME COLUMN "paystackFeeMilliFec" TO "paymentFeeMilliFec";

ALTER TABLE "JobPayment"
RENAME COLUMN "paystackReference" TO "paymentReference";


-- ============================================================
-- 3. BankDetails
--    No replacement field exists in the current schema.
--    This old Paystack recipient code is no longer used.
-- ============================================================

ALTER TABLE "bank_details"
DROP COLUMN "paystackRecipientCode";


-- ============================================================
-- 4. WithdrawalRequest
--    Rename provider-specific fields to generic fields
-- ============================================================

ALTER TABLE "withdrawal_requests"
RENAME COLUMN "paystackTransferCode" TO "transferCode";

ALTER TABLE "withdrawal_requests"
RENAME COLUMN "paystackTransferReference" TO "transferReference";

ALTER TABLE "withdrawal_requests"
RENAME COLUMN "paystackTransferStatus" TO "transferStatus";


-- ============================================================
-- 5. Recreate unique indexes using the new column names
-- ============================================================

DROP INDEX IF EXISTS "JobPayment_paystackReference_key";

DROP INDEX IF EXISTS "withdrawal_requests_paystackTransferReference_key";

CREATE UNIQUE INDEX "JobPayment_paymentReference_key"
ON "JobPayment"("paymentReference");

CREATE UNIQUE INDEX "withdrawal_requests_transferReference_key"
ON "withdrawal_requests"("transferReference");