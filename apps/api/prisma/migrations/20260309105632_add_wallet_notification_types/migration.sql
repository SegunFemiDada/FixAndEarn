-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DEPOSIT_SUCCEEDED';
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_PAID';
