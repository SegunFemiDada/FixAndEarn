/*
  Warnings:

  - A unique constraint covering the columns `[userId,role]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WalletRole" AS ENUM ('CLIENT', 'FIXER', 'SYSTEM');

-- DropIndex
DROP INDEX "wallets_userId_key";

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "role" "WalletRole" NOT NULL DEFAULT 'CLIENT';

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_role_key" ON "wallets"("userId", "role");
