-- AlterTable
ALTER TABLE "identity_verifications" ADD COLUMN     "reviewReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByAdminId" TEXT;
