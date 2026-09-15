-- CreateEnum
CREATE TYPE "NinVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- AlterTable
ALTER TABLE "identity_verifications"
ADD COLUMN "ninVerificationNote" TEXT,
ADD COLUMN "ninVerificationStatus" "NinVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "ninVerifiedAt" TIMESTAMP(3),
ADD COLUMN "ninVerifiedByAdminId" TEXT;
