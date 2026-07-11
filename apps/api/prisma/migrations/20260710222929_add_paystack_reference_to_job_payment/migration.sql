/*
  Warnings:

  - A unique constraint covering the columns `[paystackReference]` on the table `JobPayment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paystackReference` to the `JobPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `JobPayment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JobPaymentType" AS ENUM ('POSTING', 'URGENT', 'FINAL');

-- DropIndex
DROP INDEX "JobPayment_reference_key";

-- AlterTable
ALTER TABLE "JobPayment" ADD COLUMN     "paystackReference" TEXT NOT NULL,
ADD COLUMN     "type" "JobPaymentType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "JobPayment_paystackReference_key" ON "JobPayment"("paystackReference");
