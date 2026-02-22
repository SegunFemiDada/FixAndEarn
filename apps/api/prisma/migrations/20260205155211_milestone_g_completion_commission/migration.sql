/*
  Warnings:

  - You are about to drop the `ratings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_jobId_fkey";

-- DropTable
DROP TABLE "ratings";

-- CreateTable
CREATE TABLE "platform_wallets" (
    "id" TEXT NOT NULL,
    "balanceMilliFec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_ledger_entries" (
    "id" TEXT NOT NULL,
    "platformWalletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" "LedgerEntryDirection" NOT NULL,
    "amountMilliFec" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_ledger_entries_idempotencyKey_key" ON "platform_ledger_entries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "platform_ledger_entries_platformWalletId_createdAt_idx" ON "platform_ledger_entries"("platformWalletId", "createdAt");

-- AddForeignKey
ALTER TABLE "platform_ledger_entries" ADD CONSTRAINT "platform_ledger_entries_platformWalletId_fkey" FOREIGN KEY ("platformWalletId") REFERENCES "platform_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
