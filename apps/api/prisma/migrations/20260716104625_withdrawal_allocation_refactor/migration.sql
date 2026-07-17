/*
  Warnings:

  - The values [PROCESSING] on the enum `FixerEarningStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `grossMilliFec` on the `fixer_earnings` table. All the data in the column will be lost.
  - You are about to drop the column `platformFeeMilliFec` on the `fixer_earnings` table. All the data in the column will be lost.
  - You are about to drop the column `withdrawalId` on the `fixer_earnings` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FixerEarningStatus_new" AS ENUM ('AVAILABLE', 'PARTIALLY_WITHDRAWN', 'PAID', 'CANCELLED');
ALTER TABLE "fixer_earnings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "fixer_earnings" ALTER COLUMN "status" TYPE "FixerEarningStatus_new" USING ("status"::text::"FixerEarningStatus_new");
ALTER TYPE "FixerEarningStatus" RENAME TO "FixerEarningStatus_old";
ALTER TYPE "FixerEarningStatus_new" RENAME TO "FixerEarningStatus";
DROP TYPE "FixerEarningStatus_old";
ALTER TABLE "fixer_earnings" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- DropForeignKey
ALTER TABLE "fixer_earnings" DROP CONSTRAINT "fixer_earnings_withdrawalId_fkey";

-- DropIndex
DROP INDEX "fixer_earnings_withdrawalId_idx";

-- AlterTable
ALTER TABLE "fixer_earnings" DROP COLUMN "grossMilliFec",
DROP COLUMN "platformFeeMilliFec",
DROP COLUMN "withdrawalId",
ADD COLUMN     "withdrawalRequestId" TEXT;

-- CreateTable
CREATE TABLE "withdrawal_allocations" (
    "id" TEXT NOT NULL,
    "withdrawalId" TEXT NOT NULL,
    "earningId" TEXT NOT NULL,
    "amountMilliFec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdrawal_allocations_withdrawalId_idx" ON "withdrawal_allocations"("withdrawalId");

-- CreateIndex
CREATE INDEX "withdrawal_allocations_earningId_idx" ON "withdrawal_allocations"("earningId");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_allocations_withdrawalId_earningId_key" ON "withdrawal_allocations"("withdrawalId", "earningId");

-- AddForeignKey
ALTER TABLE "withdrawal_allocations" ADD CONSTRAINT "withdrawal_allocations_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "withdrawal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_allocations" ADD CONSTRAINT "withdrawal_allocations_earningId_fkey" FOREIGN KEY ("earningId") REFERENCES "fixer_earnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixer_earnings" ADD CONSTRAINT "fixer_earnings_withdrawalRequestId_fkey" FOREIGN KEY ("withdrawalRequestId") REFERENCES "withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
