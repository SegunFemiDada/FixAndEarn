/*
  Remove obsolete Paystack recipient metadata.

  Verified before migration:
  - 5 bank_details records exist.
  - 0 records have paystackRecipientCode populated.
*/

ALTER TABLE "bank_details"
  DROP COLUMN "paystackRecipientCode";