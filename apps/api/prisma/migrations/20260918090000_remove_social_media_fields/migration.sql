-- Remove legacy external social-media profile fields.
-- Existing Instagram/TikTok values are intentionally deleted.

ALTER TABLE "identity_verifications" DROP COLUMN "instagram";
ALTER TABLE "identity_verifications" DROP COLUMN "tiktok";