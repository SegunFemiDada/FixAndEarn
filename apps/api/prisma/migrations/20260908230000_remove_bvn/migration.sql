-- Remove the BVN uniqueness constraint before removing the column.
DROP INDEX IF EXISTS "identity_verifications_bvnHash_key";

-- BVN is no longer part of FixAndEarn identity verification.
ALTER TABLE "identity_verifications"
DROP COLUMN IF EXISTS "bvnHash";

-- BVN is no longer collected or stored with fixer bank details.
ALTER TABLE "bank_details"
DROP COLUMN IF EXISTS "bvnEncrypted",
DROP COLUMN IF EXISTS "bvnIv";