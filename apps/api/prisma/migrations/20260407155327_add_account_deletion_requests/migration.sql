-- CreateEnum
CREATE TYPE "DeletionRequestStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletionRequestReason" TEXT,
ADD COLUMN     "deletionRequestStatus" "DeletionRequestStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3);
