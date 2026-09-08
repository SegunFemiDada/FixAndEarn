/*
  Remove obsolete escrow notification types.

  Verified before migration:
  - No notification rows use JOB_ESCROW_LOCKED.
  - No notification rows use ESCROW_LOCKED.
  - No current application/seed/test code references either value.
*/

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

DROP TYPE "NotificationType";

ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";