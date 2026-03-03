/*
  Warnings:

  - Added the required column `bankCode` to the `bank_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bank_details" ADD COLUMN     "bankCode" TEXT NOT NULL;
