/*
  Remove obsolete automated withdrawal/payout infrastructure.

  Verified before migration:
  - 28 withdrawal requests exist.
  - No transferReference values exist.
  - No transferCode values exist.
  - No transferStatus values exist.
  - 4 historical payoutMode values exist and are all MANUAL.
  - No withdrawal has PROCESSING status.
  - No withdrawal has FAILED status.
  - No ledger entry has WITHDRAWAL_REVERSAL type.

  This migration preserves all withdrawal, allocation, earning,
  and ledger records.
*/

-- Safety checks: abort if unexpected legacy data exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "withdrawal_requests"
    WHERE "status"::text IN ('PROCESSING', 'FAILED')
  ) THEN
    RAISE EXCEPTION
      'Aborting migration: withdrawal_requests contains PROCESSING or FAILED records.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ledger_entries"
    WHERE "type"::text = 'WITHDRAWAL_REVERSAL'
  ) THEN
    RAISE EXCEPTION
      'Aborting migration: ledger_entries contains WITHDRAWAL_REVERSAL records.';
  END IF;
END $$;

-- Remove obsolete withdrawal transfer/payout columns.

ALTER TABLE "withdrawal_requests"
  DROP COLUMN "transferReference",
  DROP COLUMN "transferCode",
  DROP COLUMN "transferStatus",
  DROP COLUMN "payoutMode";

-- Remove the existing default because it depends on the old enum.

ALTER TABLE "withdrawal_requests"
  ALTER COLUMN "status" DROP DEFAULT;

-- Rebuild WithdrawalStatus without obsolete automated states.

CREATE TYPE "WithdrawalStatus_new" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PAID'
);

ALTER TABLE "withdrawal_requests"
  ALTER COLUMN "status"
  TYPE "WithdrawalStatus_new"
  USING ("status"::text::"WithdrawalStatus_new");

DROP TYPE "WithdrawalStatus";

ALTER TYPE "WithdrawalStatus_new" RENAME TO "WithdrawalStatus";

-- Restore the Prisma default using the new enum type.

ALTER TABLE "withdrawal_requests"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Rebuild LedgerEntryType without obsolete withdrawal reversal type.

CREATE TYPE "LedgerEntryType_new" AS ENUM (
  'DEPOSIT',
  'WITHDRAWAL_REQUEST',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
  'JOB_PAYMENT',
  'JOB_PAYOUT',
  'COMMISSION',
  'ADJUSTMENT',
  'FEE'
);

ALTER TABLE "ledger_entries"
  ALTER COLUMN "type"
  TYPE "LedgerEntryType_new"
  USING ("type"::text::"LedgerEntryType_new");

DROP TYPE "LedgerEntryType";

ALTER TYPE "LedgerEntryType_new" RENAME TO "LedgerEntryType";