/*
  Ensure the JobPayment unique index uses the current name.

  Earlier migration 20260816194834_cleanup_paystack_naming may already
  have removed the legacy Paystack-named index and created the current
  paymentReference index.

  This migration is therefore intentionally idempotent.
*/

DROP INDEX IF EXISTS "JobPayment_paystackReference_key";

CREATE UNIQUE INDEX IF NOT EXISTS "JobPayment_paymentReference_key"
ON "JobPayment" ("paymentReference");