-- Rename legacy Paystack withdrawal transfer fields
-- to provider-neutral names used by the current Prisma schema.
-- Existing production values are preserved.

ALTER TABLE "withdrawal_requests"
RENAME COLUMN "paystackTransferReference" TO "transferReference";

ALTER TABLE "withdrawal_requests"
RENAME COLUMN "paystackTransferCode" TO "transferCode";

ALTER TABLE "withdrawal_requests"
RENAME COLUMN "paystackTransferStatus" TO "transferStatus";

ALTER INDEX "withdrawal_requests_paystackTransferReference_key"
RENAME TO "withdrawal_requests_transferReference_key";