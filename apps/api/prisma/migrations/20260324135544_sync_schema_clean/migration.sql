/*
  Warnings:

  - The `status` column on the `Deposit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `emailVerifiedAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifyTokenExpiresAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifyTokenHash` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the `deposit_intents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Deposit" DROP CONSTRAINT "Deposit_userId_fkey";

-- DropForeignKey
ALTER TABLE "deposit_intents" DROP CONSTRAINT "deposit_intents_userId_fkey";

-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "status",
ADD COLUMN     "status" "DepositStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "emailVerifiedAt",
DROP COLUMN "emailVerifyTokenExpiresAt",
DROP COLUMN "emailVerifyTokenHash";

-- DropTable
DROP TABLE "deposit_intents";

-- CreateIndex
CREATE INDEX "Deposit_reference_idx" ON "Deposit"("reference");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
