/*
  Rename the legacy Paystack-named JobPayment unique index.

  The underlying unique constraint already applies to paymentReference.
  This migration changes only the index name; no data or constraint
  semantics are changed.
*/

ALTER INDEX "JobPayment_paystackReference_key"
  RENAME TO "JobPayment_paymentReference_key";